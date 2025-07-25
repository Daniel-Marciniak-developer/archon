from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from pydantic import BaseModel
import asyncpg
from app.auth import AuthorizedUser
import os
import tempfile
import shutil
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.libs.analysis_engine import run_analysis
import hashlib
import mimetypes
import json
import subprocess
import asyncio
import random
import time
import traceback

router = APIRouter(prefix="/projects", tags=["Projects"])

def rate_limit(limit_string):
    """Decorator that applies rate limiting if available, otherwise does nothing"""
    def decorator(func):
        return func
    return decorator

async def run_project_analysis(project_id: int, analysis_id: int, repo_url: str):
    """Run real analysis for a project"""
    conn = None
    project_path = None
    try:
        conn = await get_db_connection()
        await conn.execute(
            "UPDATE analyses SET status = 'running' WHERE id = $1",
            analysis_id
        )

        project_path = tempfile.mkdtemp()

        try:
            subprocess.run(
                ["git", "clone", repo_url, project_path],
                check=True,
                capture_output=True,
                timeout=300
            )
        except subprocess.TimeoutExpired:
            raise Exception("Repository cloning timed out")
        except subprocess.CalledProcessError as e:
            raise Exception(f"Failed to clone repository: {e}")

        report = run_analysis(project_path)

        report_file_path = f"/app/analysis_reports/analysis_report_{project_id}.json"
        with open(report_file_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        overall_score = report['overall_score']
        structure_score = report['structure_score']
        quality_score = report['quality_score']
        security_score = report['security_score']
        dependencies_score = report['dependencies_score']

        await conn.execute(
            """
            UPDATE analyses SET
                status = 'completed',
                completed_at = $1,
                overall_score = $2,
                structure_score = $3,
                quality_score = $4,
                security_score = $5,
                dependencies_score = $6
            WHERE id = $7
            """,
            datetime.now(),
            overall_score,
            structure_score,
            quality_score,
            security_score,
            dependencies_score,
            analysis_id
        )
        await conn.execute(
            "UPDATE projects SET last_analysis_id = $1 WHERE id = $2",
            analysis_id,
            project_id
        )

    except Exception as e:
        if conn:
            try:
                await conn.execute(
                    "UPDATE analyses SET status = 'failed' WHERE id = $1",
                    analysis_id
                )
            except:
                pass
        raise
    finally:
        if conn:
            await conn.close()
        if project_path and os.path.exists(project_path):
            shutil.rmtree(project_path)

MAX_FILE_SIZE = 50 * 1024 * 1024
MAX_TOTAL_SIZE = 200 * 1024 * 1024
MAX_FILES_COUNT = 1000
MAX_FILENAME_LENGTH = 255
MAX_FILEPATH_LENGTH = 1000

ALLOWED_EXTENSIONS = {
    '.py', '.pyx', '.pyi', '.pyw',
    '.txt', '.md', '.rst',
    '.json', '.yaml', '.yml', '.toml', '.cfg', '.ini',
    '.gitignore', '.gitattributes',
    '.dockerfile',
    '.sql',
    '.env.example',
}

DANGEROUS_EXTENSIONS = {
    '.exe', '.dll', '.so', '.dylib', '.bin', '.bat', '.cmd', '.ps1', '.sh',
    '.scr', '.com', '.pif', '.jar', '.war', '.ear', '.class', '.dex',
    '.apk', '.ipa', '.dmg', '.pkg', '.msi', '.rpm', '.deb',
    '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
    '.js', '.ts', '.jsx', '.tsx',
    '.php', '.asp', '.aspx', '.jsp',
    '.vbs', '.wsf', '.hta',
}

SUSPICIOUS_PATTERNS = [
    r'\.\./',
    r'[<>:"|?*]',
    r'^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)',
    r'^\.',
    r'__pycache__',
    r'\.pyc$',
    r'node_modules',
    r'\.git/',
]

PYTHON_PROJECT_INDICATORS = {
    'setup.py', 'pyproject.toml', 'requirements.txt',
    'Pipfile', 'poetry.lock', 'conda.yml', 'environment.yml',
    'main.py', '__init__.py', 'app.py', 'manage.py'
}

MALICIOUS_CONTENT_PATTERNS = [
    rb'<script',
    rb'eval\s*\(',
    rb'exec\s*\(',
    rb'__import__\s*\(',
    rb'subprocess\.',
    rb'os\.system',
    rb'shell=True',
]


class GitHubRepo(BaseModel):
    """GitHub repository information"""
    id: int
    name: str
    full_name: str
    owner: dict
    html_url: str
    description: Optional[str] = None
    private: bool
    language: Optional[str] = None
    updated_at: str


class ProjectCreateRequest(BaseModel):
    """Request model for creating a new project"""
    repo_name: str
    repo_owner: str
    repo_url: str

class FileUploadResponse(BaseModel):
    """Response model for file upload"""
    project_id: int
    project_name: str
    files_processed: int
    total_size_bytes: int
    validation_results: Dict[str, Any]
    created_at: str


class ProjectResponse(BaseModel):
    """Response model for project with latest analysis"""
    id: int
    repo_name: str
    repo_owner: str
    repo_url: str
    project_source: str = "github"
    upload_metadata: Optional[Dict] = None
    created_at: datetime
    latest_analysis: Optional[dict] = None


class GitHubReposResponse(BaseModel):
    """Response model for GitHub repositories list"""
    repositories: List[GitHubRepo]


async def get_or_create_user(user_id: str) -> int:
    """Get existing user or create new user from auth ID"""
    conn = await get_db_connection()
    try:
        import hashlib
        hash_bytes = hashlib.sha256(user_id.encode()).digest()
        db_user_id = int.from_bytes(hash_bytes[:4], byteorder='big') % (2**31 - 1)

        user_row = await conn.fetchrow(
            "SELECT id FROM users WHERE id = $1",
            db_user_id
        )

        if user_row:
            return user_row["id"]
        else:
            return db_user_id
    finally:
        await conn.close()


def get_mock_github_user_data() -> dict:
    """Mock GitHub user data for development"""
    return {
        "id": 12345,
        "login": "demo-user",
        "avatar_url": "https://github.com/identicons/demo.png"
    }


def validate_mock_github_repo(repo_owner: str, repo_name: str) -> dict:
    """Mock GitHub repository validation"""
    return {
        "id": 67890,
        "name": repo_name,
        "full_name": f"{repo_owner}/{repo_name}",
        "owner": {"login": repo_owner},
        "html_url": f"https://github.com/{repo_owner}/{repo_name}"
    }


async def get_db_connection():
    """Get database connection"""
    db_url = os.getenv("DATABASE_URL_DEV")
    if not db_url:
        raise ValueError("DATABASE_URL_DEV not found in environment variables")
    return await asyncpg.connect(db_url)


@router.get("")
async def get_projects(user: AuthorizedUser) -> List[ProjectResponse]:
    """Get all projects for the authenticated user"""
    db_user_id = await get_or_create_user(user.sub)

    conn = None
    try:
        conn = await get_db_connection()

        projects_query = """
            SELECT p.id, p.repo_name, p.repo_owner, p.repo_url, p.project_source,
                   p.upload_metadata, p.last_analysis_id, p.created_at as project_created_at,
                   a.overall_score, a.structure_score, a.quality_score,
                   a.security_score, a.dependencies_score, a.status as analysis_status,
                   a.created_at as analysis_created_at, a.completed_at as analysis_completed_at
            FROM projects p
            LEFT JOIN analyses a ON p.last_analysis_id = a.id
            WHERE p.user_id = $1
            ORDER BY p.id DESC
        """

        rows = await conn.fetch(projects_query, db_user_id)

        projects = []

        for row in rows:
            project_data = {
                "id": row["id"],
                "repo_name": row["repo_name"],
                "repo_owner": row["repo_owner"],
                "repo_url": row["repo_url"],
                "project_source": row.get("project_source", "github"),
                "upload_metadata": row.get("upload_metadata"),
                "created_at": row["project_created_at"].isoformat() if row.get("project_created_at") else None,
                "latest_analysis": None
            }

            if row["last_analysis_id"]:
                project_data["latest_analysis"] = {
                    "id": row["last_analysis_id"],
                    "overall_score": float(row["overall_score"]) if row["overall_score"] else 0.0,
                    "structure_score": float(row["structure_score"]) if row["structure_score"] else 0.0,
                    "quality_score": float(row["quality_score"]) if row["quality_score"] else 0.0,
                    "security_score": float(row["security_score"]) if row["security_score"] else 0.0,
                    "dependencies_score": float(row["dependencies_score"]) if row["dependencies_score"] else 0.0,
                    "status": row["analysis_status"],
                    "created_at": row["analysis_created_at"].isoformat() if row["analysis_created_at"] else None,
                    "completed_at": row["analysis_completed_at"].isoformat() if row["analysis_completed_at"] else None
                }

            projects.append(project_data)

        return projects

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        if conn:
            await conn.close()


@router.get("/github/repositories", response_model=GitHubReposResponse)
async def get_github_repositories(request: Request, user: AuthorizedUser) -> GitHubReposResponse:
    """
    Fetch user's GitHub repositories for project import.
    This endpoint delegates to the github_auth module for actual GitHub API integration.
    """
    try:
        from app.apis.github_auth import get_github_repositories as fetch_github_repos

        github_response = await fetch_github_repos(request, user)

        repos = []
        for repo_data in github_response["repositories"]:
            repos.append(GitHubRepo(
                id=repo_data["id"],
                name=repo_data["name"],
                full_name=repo_data["full_name"],
                owner=repo_data["owner"],
                html_url=repo_data["html_url"],
                description=repo_data.get("description"),
                private=repo_data["private"],
                language=repo_data.get("language"),
                updated_at=repo_data["updated_at"]
            ))

        return GitHubReposResponse(repositories=repos)

    except Exception as e:
        print(f"❌ Error fetching GitHub repositories: {str(e)}")
        mock_repos = [
            GitHubRepo(
                id=1,
                name="python-data-analyzer",
                full_name="demo-user/python-data-analyzer",
                owner={"login": "demo-user"},
                html_url="https://github.com/demo-user/python-data-analyzer",
                description="A comprehensive Python data analysis toolkit",
                private=False,
                language="Python",
                updated_at="2024-01-15T10:30:00Z"
            ),
        GitHubRepo(
            id=2,
            name="data-processing-tool",
            full_name="demo-user/data-processing-tool",
            owner={"login": "demo-user"},
            html_url="https://github.com/demo-user/data-processing-tool",
            description="Python tool for data processing and analysis",
            private=True,
            language="Python",
            updated_at="2024-01-10T15:45:00Z"
        ),
        GitHubRepo(
            id=3,
            name="ml-experiment",
            full_name="demo-user/ml-experiment",
            owner={"login": "demo-user"},
            html_url="https://github.com/demo-user/ml-experiment",
            description="Machine learning experiments and models",
            private=False,
            language="Python",
            updated_at="2024-01-05T09:20:00Z"
        )
    ]
    
    return GitHubReposResponse(repositories=mock_repos)


@router.post("/validate-github-repo")
async def validate_github_repo(repo_data: dict, user: AuthorizedUser) -> dict:
    """
    Validate a GitHub repository for Python project suitability
    """
    try:
        validation_result = validate_github_repository(repo_data)
        return {
            "validation": validation_result,
            "repository": repo_data
        }
    except Exception as e:
        print(f"❌ API: GitHub repo validation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Repository validation failed")


@router.post("")
async def create_project(request: ProjectCreateRequest, user: AuthorizedUser) -> ProjectResponse:
    """Create a new project with comprehensive logging"""
    operation_start = time.time()

    print(f"📊 API: POST /projects - Starting request for user {user.sub}")
    print(f"📝 API: Project details - repo: {request.repo_owner}/{request.repo_name}, url: {request.repo_url}")

    conn = None
    try:
        if not request.repo_name or not request.repo_owner:
            print(f"❌ API: Invalid input - missing repo_name or repo_owner")
            raise HTTPException(status_code=400, detail="Repository name and owner are required")

        db_user_id = await get_or_create_user(user.sub)
        print(f"🔄 ID Conversion: {user.sub} -> {db_user_id}")

        conn = await get_db_connection()
        
        check_start = time.time()
        print(f"🔍 Database: Checking for existing project {request.repo_owner}/{request.repo_name}")
        
        existing_query = """
            SELECT id FROM projects 
            WHERE user_id = $1 AND repo_owner = $2 AND repo_name = $3
        """
        existing = await conn.fetchrow(existing_query, db_user_id, request.repo_owner, request.repo_name)
        
        check_time = (time.time() - check_start) * 1000
        print(f"✅ Database: Duplicate check completed in {check_time:.2f}ms")
        
        if existing:
            print(f"⚠️ API: Project already exists with ID {existing['id']}")
            raise HTTPException(
                status_code=409, 
                detail=f"Project {request.repo_owner}/{request.repo_name} already exists"
            )
        
        insert_start = time.time()
        print(f"➕ Database: Creating new project")

        insert_query = """
            INSERT INTO projects (user_id, repo_name, repo_owner, repo_url, project_source, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id, repo_name, repo_owner, repo_url, created_at
        """

        new_project = await conn.fetchrow(
            insert_query,
            db_user_id,
            request.repo_name,
            request.repo_owner,
            request.repo_url,
            'github'
        )
        
        insert_time = (time.time() - insert_start) * 1000
        total_time = (time.time() - operation_start) * 1000
        
        print(f"✅ Database: Project created successfully in {insert_time:.2f}ms")
        print(f"🎉 API: POST /projects completed successfully in {total_time:.2f}ms")
        print(f"📈 API: New project ID: {new_project['id']}")
        
        return ProjectResponse(
            id=new_project["id"],
            repo_name=new_project["repo_name"],
            repo_owner=new_project["repo_owner"],
            repo_url=new_project["repo_url"],
            created_at=new_project["created_at"],
            latest_analysis=None
        )
        
    except HTTPException:
        raise
    except asyncpg.UniqueViolationError as e:
        error_time = (time.time() - operation_start) * 1000
        print(f"⚠️ Database: Unique constraint violation after {error_time:.2f}ms - {str(e)}")
        raise HTTPException(
            status_code=409, 
            detail=f"Project {request.repo_owner}/{request.repo_name} already exists"
        )
    except asyncpg.PostgresError as e:
        error_time = (time.time() - operation_start) * 1000
        print(f"❌ Database: PostgreSQL error after {error_time:.2f}ms - {str(e)}")
        print(f"📊 Database: Error code: {e.sqlstate}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        error_time = (time.time() - operation_start) * 1000
        print(f"❌ API: Unexpected error in POST /projects after {error_time:.2f}ms - {str(e)}")
        print(f"📊 API: Full error traceback:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        if conn:
            await conn.close()
            print(f"🔌 Database: Connection closed")


def convert_user_id_to_int(user_id: str) -> int:
    """Convert string user ID to consistent integer for database compatibility"""
    import hashlib
    hash_bytes = hashlib.sha256(user_id.encode()).digest()
    db_user_id = int.from_bytes(hash_bytes[:4], byteorder='big') % (2**31 - 1)
    print(f"🔄 ID Conversion: {user_id} -> {db_user_id}")
    return db_user_id


@router.delete("/{project_id}")
async def delete_project(project_id: int, user: AuthorizedUser):
    """
    Delete a project and all associated data.
    Only the project owner can delete their projects.
    """
    operation_start = time.time()
    db_user_id = await get_or_create_user(user.sub)

    print(f"🗑️ API: DELETE /projects/{project_id} - Starting request for user {user.sub} (DB ID: {db_user_id})")

    conn = None
    try:
        conn = await get_db_connection()

        project_record = await conn.fetchrow(
            "SELECT id, repo_name, repo_owner, project_source FROM projects WHERE id = $1 AND user_id = $2",
            project_id, db_user_id
        )

        if not project_record:
            print(f"❌ API: Project {project_id} not found or access denied for user {db_user_id}")
            raise HTTPException(status_code=404, detail="Project not found or access denied")

        print(f"🔍 API: Found project {project_record['repo_owner']}/{project_record['repo_name']} (source: {project_record['project_source']})")

        delete_result = await conn.execute(
            "DELETE FROM projects WHERE id = $1 AND user_id = $2",
            project_id, db_user_id
        )

        if delete_result == "DELETE 0":
            print(f"❌ API: No project deleted - unexpected error")
            raise HTTPException(status_code=500, detail="Failed to delete project")

        total_time = (time.time() - operation_start) * 1000
        print(f"✅ API: Project {project_id} deleted successfully in {total_time:.2f}ms")

        return {
            "message": "Project deleted successfully",
            "project_id": project_id,
            "project_name": f"{project_record['repo_owner']}/{project_record['repo_name']}"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ API: Delete project error: {str(e)}")
        print(f"❌ API: Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to delete project")
    finally:
        if conn:
            await conn.close()


@router.post("/{project_id}/analyze", status_code=202)
async def start_analysis(project_id: int, user: AuthorizedUser):
    """
    Starts a new analysis for a project.
    """
    conn = None
    try:
        db_user_id = await get_or_create_user(user.sub)
        conn = await get_db_connection()

        project_record = await conn.fetchrow(
            "SELECT repo_url FROM projects WHERE id = $1 AND user_id = $2",
            project_id, db_user_id
        )
        if not project_record:
            raise HTTPException(status_code=404, detail="Project not found or access denied")

        user_record = await conn.fetchrow(
            "SELECT github_access_token FROM users WHERE id = $1", db_user_id
        )
        if not user_record or not user_record['github_access_token']:
            raise HTTPException(status_code=403, detail="User GitHub token not found.")
        
        analysis_id = await conn.fetchval(
            """
            INSERT INTO analyses (project_id, status, created_at, overall_score, structure_score, quality_score, security_score, dependencies_score)
            VALUES ($1, 'pending', NOW(), 0, 0, 0, 0, 0)
            RETURNING id
            """,
            project_id
        )

        await conn.execute(
            "UPDATE projects SET last_analysis_id = $1 WHERE id = $2",
            analysis_id,
            project_id
        )

        asyncio.create_task(run_project_analysis(
            project_id=project_id,
            analysis_id=analysis_id,
            repo_url=project_record['repo_url']
        ))

        return {"message": "Analysis started", "analysis_id": analysis_id}

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            await conn.close()


@router.get("/{project_id}/files")
async def get_project_files(project_id: int, user: AuthorizedUser, branch: str = "main"):
    """
    Get file structure for a GitHub project.
    Returns the complete file tree for the specified branch.
    """
    operation_start = time.time()
    db_user_id = await get_or_create_user(user.sub)

    print(f"📁 API: GET /projects/{project_id}/files - Starting request for user {user.sub} (DB ID: {db_user_id}, branch: {branch})")

    conn = None
    try:
        conn = await get_db_connection()

        project_record = await conn.fetchrow(
            "SELECT repo_name, repo_owner, repo_url, project_source FROM projects WHERE id = $1 AND user_id = $2",
            project_id, db_user_id
        )

        if not project_record:
            print(f"❌ API: Project {project_id} not found or access denied for user {db_user_id}")
            raise HTTPException(status_code=404, detail="Project not found or access denied")

        print(f"✅ API: Found project {project_record['repo_owner']}/{project_record['repo_name']} (source: {project_record['project_source']})")

        if project_record['project_source'] != 'github':
            print(f"❌ API: Project source '{project_record['project_source']}' not supported for file structure")
            raise HTTPException(status_code=400, detail="File structure only available for GitHub projects")

        print(f"🔑 API: Fetching GitHub token for user {db_user_id}")
        user_record = await conn.fetchrow(
            "SELECT github_access_token FROM users WHERE id = $1", db_user_id
        )
        if not user_record or not user_record['github_access_token']:
            print(f"❌ API: No GitHub token found for user {db_user_id}")
            raise HTTPException(status_code=403, detail="GitHub token not found")

        print(f"✅ API: GitHub token found for user {db_user_id}")

        import requests

        github_token = user_record['github_access_token']
        repo_owner = project_record['repo_owner']
        repo_name = project_record['repo_name']

        branches_url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/branches"
        branches_response = requests.get(
            branches_url,
            headers={
                "Authorization": f"token {github_token}",
                "Accept": "application/vnd.github.v3+json"
            }
        )

        if branches_response.status_code != 200:
            print(f"❌ API: Failed to fetch branches: {branches_response.status_code}")
            raise HTTPException(status_code=500, detail="Failed to fetch repository branches")

        branches_data = branches_response.json()
        available_branches = [b['name'] for b in branches_data]

        if branch not in available_branches:
            print(f"❌ API: Branch '{branch}' not found in {available_branches}")
            raise HTTPException(status_code=404, detail=f"Branch '{branch}' not found")

        tree_url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/git/trees/{branch}?recursive=1"
        tree_response = requests.get(
            tree_url,
            headers={
                "Authorization": f"token {github_token}",
                "Accept": "application/vnd.github.v3+json"
            }
        )

        if tree_response.status_code != 200:
            print(f"❌ API: Failed to fetch file tree: {tree_response.status_code}")
            raise HTTPException(status_code=500, detail="Failed to fetch repository file tree")

        tree_data = tree_response.json()

        def build_file_tree(tree_items):
            root_items = {}

            for item in tree_items:
                if item['type'] in ['blob', 'tree']:
                    path_parts = item['path'].split('/')
                    current_level = root_items

                    for i, part in enumerate(path_parts):
                        if i == len(path_parts) - 1:
                            if item['type'] == 'blob':
                                current_level[part] = {
                                    'type': 'file',
                                    'path': item['path'],
                                    'name': part
                                }
                            else:
                                if part not in current_level:
                                    current_level[part] = {
                                        'type': 'folder',
                                        'path': item['path'],
                                        'name': part,
                                        'children': {}
                                    }
                        else:
                            if part not in current_level:
                                current_level[part] = {
                                    'type': 'folder',
                                    'path': '/'.join(path_parts[:i+1]),
                                    'name': part,
                                    'children': {}
                                }
                            current_level = current_level[part]['children']

            def dict_to_list(items_dict):
                result = []
                for name, item in sorted(items_dict.items()):
                    if item['type'] == 'folder':
                        children = dict_to_list(item['children'])
                        result.append({
                            'type': 'folder',
                            'path': item['path'],
                            'name': item['name'],
                            'children': children
                        })
                    else:
                        result.append({
                            'type': 'file',
                            'path': item['path'],
                            'name': item['name']
                        })
                return result

            return dict_to_list(root_items)

        file_tree = build_file_tree(tree_data['tree'])

        total_time = (time.time() - operation_start) * 1000
        print(f"✅ API: File tree fetched successfully in {total_time:.2f}ms ({len(tree_data['tree'])} items)")

        return {
            "repository": {
                "name": f"{repo_owner}/{repo_name}",
                "url": project_record['repo_url'],
                "description": f"Repository {repo_owner}/{repo_name}",
                "availableBranches": available_branches,
                "currentBranch": branch
            },
            "fileTree": file_tree
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ API: Get project files error: {str(e)}")
        print(f"❌ API: Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to fetch project files")
    finally:
        if conn:
            await conn.close()


@router.get("/{project_id}/files/content")
async def get_file_content(project_id: int, file_path: str, user: AuthorizedUser, branch: str = "main"):
    """
    Get content of a specific file from a GitHub project.
    """
    operation_start = time.time()
    db_user_id = await get_or_create_user(user.sub)

    print(f"📄 API: GET /projects/{project_id}/files/content - File: {file_path} (branch: {branch})")

    conn = None
    try:
        conn = await get_db_connection()

        project_record = await conn.fetchrow(
            "SELECT repo_name, repo_owner, project_source FROM projects WHERE id = $1 AND user_id = $2",
            project_id, db_user_id
        )

        if not project_record:
            print(f"❌ API: Project {project_id} not found or access denied for user {db_user_id}")
            raise HTTPException(status_code=404, detail="Project not found or access denied")

        if project_record['project_source'] != 'github':
            raise HTTPException(status_code=400, detail="File content only available for GitHub projects")

        user_record = await conn.fetchrow(
            "SELECT github_access_token FROM users WHERE id = $1", db_user_id
        )
        if not user_record or not user_record['github_access_token']:
            raise HTTPException(status_code=403, detail="GitHub token not found")

        import requests
        import base64

        github_token = user_record['github_access_token']
        repo_owner = project_record['repo_owner']
        repo_name = project_record['repo_name']

        file_url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/contents/{file_path}?ref={branch}"
        file_response = requests.get(
            file_url,
            headers={
                "Authorization": f"token {github_token}",
                "Accept": "application/vnd.github.v3+json"
            }
        )

        if file_response.status_code == 404:
            raise HTTPException(status_code=404, detail="File not found")
        elif file_response.status_code != 200:
            print(f"❌ API: Failed to fetch file content: {file_response.status_code}")
            raise HTTPException(status_code=500, detail="Failed to fetch file content")

        file_data = file_response.json()

        if file_data.get('encoding') == 'base64':
            try:
                content = base64.b64decode(file_data['content']).decode('utf-8')
            except UnicodeDecodeError:
                raise HTTPException(status_code=400, detail="File is not a text file")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file encoding")

        total_time = (time.time() - operation_start) * 1000
        print(f"✅ API: File content fetched successfully in {total_time:.2f}ms")

        return {
            "content": content,
            "path": file_path,
            "size": file_data.get('size', 0),
            "sha": file_data.get('sha', '')
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ API: Get file content error: {str(e)}")
        print(f"❌ API: Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to fetch file content")
    finally:
        if conn:
            await conn.close()


def validate_filename_security(filename: str) -> tuple[bool, str]:
    """Enhanced filename security validation"""
    import re

    if len(filename) > MAX_FILENAME_LENGTH:
        return False, f"Filename too long (max {MAX_FILENAME_LENGTH} characters)"

    ext = Path(filename).suffix.lower()
    if ext in DANGEROUS_EXTENSIONS:
        return False, f"Dangerous file type: {ext}"

    for pattern in SUSPICIOUS_PATTERNS:
        if re.search(pattern, filename, re.IGNORECASE):
            return False, f"Suspicious filename pattern detected"

    if '\x00' in filename or any(ord(c) < 32 for c in filename if c not in '\t\n\r'):
        return False, "Invalid characters in filename"

    return True, ""

def validate_file_extension(filename: str) -> bool:
    """Check if file extension is allowed"""
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS or filename.lower() in PYTHON_PROJECT_INDICATORS

def validate_file_size(file_size: int) -> bool:
    """Check if file size is within limits"""
    return file_size <= MAX_FILE_SIZE

def validate_file_content_security(content: bytes, filename: str) -> tuple[bool, str]:
    """Basic content security validation"""
    for pattern in MALICIOUS_CONTENT_PATTERNS:
        if pattern in content:
            return False, f"Potentially malicious content detected in {filename}"

    if b'\x00' in content and not filename.endswith(('.pyc', '.pyo')):
        null_ratio = content.count(b'\x00') / len(content) if content else 0
        if null_ratio > 0.1:
            return False, f"Suspicious binary content in {filename}"

    if len(content) == 0 and not filename.endswith(('__init__.py', '.gitkeep')):
        return False, f"Empty file detected: {filename}"

    return True, ""

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage"""
    import re

    filename = re.sub(r'[<>:"|?*]', '_', filename)
    filename = re.sub(r'\.\.+', '.', filename)
    filename = filename.strip('. ')

    if not filename:
        filename = 'unnamed_file'

    return filename

def analyze_python_project_simple(files_metadata: List[Dict]) -> Dict[str, Any]:
    """Enhanced analysis of uploaded files to determine if it's a valid Python project"""
    python_files = [f for f in files_metadata if f['filename'].endswith(('.py', '.pyx', '.pyi'))]
    project_files = [f['filename'].lower() for f in files_metadata]
    indicators_found = PYTHON_PROJECT_INDICATORS.intersection(set(project_files))

    confidence = 0.0
    detected_frameworks = []
    entry_points = []
    dependencies = []
    warnings = []
    errors = []

    if python_files:
        confidence += 0.4

        for py_file in python_files:
            filename = py_file['filename'].lower()
            if filename in ['main.py', 'app.py', 'run.py', 'server.py']:
                entry_points.append(py_file['filename'])
                confidence += 0.1
            elif filename == '__init__.py':
                detected_frameworks.append('Python Package')
                confidence += 0.05

    if indicators_found:
        confidence += 0.3

        if 'requirements.txt' in project_files:
            dependencies.append('pip requirements')
            confidence += 0.1
        if 'pyproject.toml' in project_files:
            dependencies.append('pyproject.toml')
            confidence += 0.1
        if 'pipfile' in project_files:
            dependencies.append('Pipfile')
            confidence += 0.1
        if 'setup.py' in project_files:
            detected_frameworks.append('Setuptools Package')
            confidence += 0.1

    for file_meta in files_metadata:
        filename = file_meta['filename'].lower()

        if filename == 'manage.py' or 'django' in filename:
            detected_frameworks.append('Django')
            confidence += 0.1

        elif 'flask' in filename or filename in ['wsgi.py', 'application.py']:
            detected_frameworks.append('Flask')
            confidence += 0.1

        elif 'fastapi' in filename or filename in ['main.py', 'api.py']:
            if 'FastAPI' not in detected_frameworks:
                detected_frameworks.append('FastAPI')
                confidence += 0.1

        elif filename.endswith('.ipynb'):
            detected_frameworks.append('Jupyter Notebook')
            confidence += 0.05

        elif filename in ['analysis.py', 'model.py', 'train.py', 'predict.py']:
            detected_frameworks.append('Data Science')
            confidence += 0.05

    has_src_structure = any('src/' in f['filename'] for f in files_metadata)
    has_tests = any('test' in f['filename'].lower() for f in files_metadata)
    has_docs = any('doc' in f['filename'].lower() or 'readme' in f['filename'].lower() for f in files_metadata)

    if has_src_structure:
        confidence += 0.05
        warnings.append("Standard src/ structure detected")
    if has_tests:
        confidence += 0.05
        warnings.append("Test files detected")
    if has_docs:
        confidence += 0.05
        warnings.append("Documentation files detected")

    if not python_files and not indicators_found:
        errors.append("No Python files or project indicators found")
        confidence = 0.0

    if len(python_files) == 0 and len(indicators_found) == 0:
        errors.append("This doesn't appear to be a Python project")
    elif len(python_files) < 2 and not indicators_found:
        warnings.append("Very few Python files detected - may not be a complete project")

    total_size = sum(f['size'] for f in files_metadata)
    if total_size > MAX_TOTAL_SIZE:
        errors.append(f"Project too large ({total_size / 1024 / 1024:.1f}MB > {MAX_TOTAL_SIZE / 1024 / 1024}MB)")

    if total_size < 1024:
        warnings.append("Project seems very small - may be incomplete")

    suspicious_extensions = {'.exe', '.dll', '.so', '.dylib', '.bin'}
    suspicious_files = [f for f in files_metadata if any(f['filename'].lower().endswith(ext) for ext in suspicious_extensions)]
    if suspicious_files:
        warnings.append(f"Suspicious binary files detected: {', '.join(f['filename'] for f in suspicious_files[:3])}")

    return {
        'is_python_project': confidence >= 0.3,
        'confidence_score': min(confidence, 1.0),
        'detected_frameworks': list(set(detected_frameworks)),
        'entry_points': entry_points,
        'dependencies_found': list(set(dependencies)),
        'total_files': len(files_metadata),
        'python_files': len(python_files),
        'total_size_bytes': total_size,
        'indicators_found': list(indicators_found),
        'structure_analysis': {
            'has_src_structure': has_src_structure,
            'has_tests': has_tests,
            'has_docs': has_docs,
            'suspicious_files': len(suspicious_files)
        },
        'warnings': warnings,
        'errors': errors
    }

def validate_github_repository(repo_data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate GitHub repository for Python project suitability"""
    warnings = []
    errors = []
    confidence = 0.0

    language = repo_data.get('language') or ''
    language = language.lower() if language else ''
    if language == 'python':
        confidence += 0.5
    elif language in ['jupyter notebook', 'python']:
        confidence += 0.3
    elif language and language != 'python':
        warnings.append(f"Repository language is {language}, not Python")
        confidence -= 0.2

    updated_at = repo_data.get('updated_at', '')
    if updated_at:
        try:
            from datetime import datetime, timezone
            import dateutil.parser
            last_update = dateutil.parser.parse(updated_at)
            days_since_update = (datetime.now(timezone.utc) - last_update).days

            if days_since_update > 365:
                warnings.append(f"Repository hasn't been updated in {days_since_update} days")
            elif days_since_update > 30:
                warnings.append(f"Repository last updated {days_since_update} days ago")
            else:
                confidence += 0.1
        except Exception:
            pass

    stars = repo_data.get('stargazers_count', 0)
    if stars > 100:
        confidence += 0.1
    elif stars > 10:
        confidence += 0.05

    repo_name = repo_data.get('name') or ''
    repo_name = repo_name.lower() if repo_name else ''
    python_keywords = ['python', 'py', 'django', 'flask', 'fastapi', 'api', 'web', 'app', 'tool', 'script']
    if any(keyword in repo_name for keyword in python_keywords):
        confidence += 0.1

    description = repo_data.get('description') or ''
    description = description.lower() if description else ''
    if description:
        if any(keyword in description for keyword in python_keywords):
            confidence += 0.1
        if 'python' in description:
            confidence += 0.2
    else:
        warnings.append("Repository has no description")

    if repo_data.get('fork', False):
        warnings.append("This is a forked repository")

    if repo_data.get('private', False):
        warnings.append("This is a private repository")

    return {
        'is_suitable': confidence >= 0.3,
        'confidence_score': min(max(confidence, 0.0), 1.0),
        'warnings': warnings,
        'errors': errors,
        'analysis': {
            'language': language,
            'stars': stars,
            'is_fork': repo_data.get('fork', False),
            'is_private': repo_data.get('private', False),
            'has_description': bool(description)
        }
    }


@router.post("/upload", response_model=FileUploadResponse)
@rate_limit("5/minute")
async def upload_project_files(
    user: AuthorizedUser,
    files: List[UploadFile] = File(...),
    project_name: Optional[str] = Form(None)
) -> FileUploadResponse:
    """
    Upload project files and create a new project.
    Supports multiple files and basic project validation.
    """
    operation_start = time.time()
    db_user_id = await get_or_create_user(user.sub)

    print(f"📤 API: POST /upload - Starting upload for user {user.sub} (DB ID: {db_user_id})")
    print(f"📁 API: Received {len(files)} files")

    try:
        files_metadata = []
        total_size = 0

        if len(files) > MAX_FILES_COUNT:
            raise HTTPException(
                status_code=413,
                detail=f"Too many files: {len(files)} (max {MAX_FILES_COUNT})"
            )

        for file in files:
            if not file.filename:
                continue

            filename_valid, filename_error = validate_filename_security(file.filename)
            if not filename_valid:
                raise HTTPException(
                    status_code=400,
                    detail=f"Security validation failed for {file.filename}: {filename_error}"
                )

            safe_filename = sanitize_filename(file.filename)

            if not validate_file_extension(safe_filename):
                raise HTTPException(
                    status_code=400,
                    detail=f"File type not allowed: {safe_filename}"
                )

            content = await file.read()
            file_size = len(content)

            if not validate_file_size(file_size):
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large: {safe_filename} ({file_size / 1024 / 1024:.1f}MB > {MAX_FILE_SIZE / 1024 / 1024}MB)"
                )

            content_valid, content_error = validate_file_content_security(content, safe_filename)
            if not content_valid:
                raise HTTPException(
                    status_code=400,
                    detail=f"Content security validation failed: {content_error}"
                )

            total_size += file_size

            if total_size > MAX_TOTAL_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"Total upload size too large ({total_size / 1024 / 1024:.1f}MB > {MAX_TOTAL_SIZE / 1024 / 1024}MB)"
                )

            files_metadata.append({
                'filename': file.filename,
                'size': file_size,
                'hash': hashlib.sha256(content).hexdigest(),
                'mime_type': mimetypes.guess_type(file.filename)[0]
            })

            await file.seek(0)

        print(f"💾 API: Processed {len(files_metadata)} files ({total_size / 1024 / 1024:.1f}MB)")

        validation_result = analyze_python_project_simple(files_metadata)
        print(f"🔍 API: Project analysis - Python: {validation_result['is_python_project']}, Confidence: {validation_result['confidence_score']:.2f}")

        if not validation_result['is_python_project']:
            raise HTTPException(
                status_code=400,
                detail=f"Not a valid Python project (confidence: {validation_result['confidence_score']:.2f}). Errors: {', '.join(validation_result['errors'])}"
            )

        if validation_result['errors']:
            raise HTTPException(
                status_code=400,
                detail=f"Project validation failed: {', '.join(validation_result['errors'])}"
            )

        if not project_name:
            project_name = f"uploaded-project-{int(time.time())}"

        conn = await get_db_connection()
        try:
            existing = await conn.fetchrow(
                "SELECT id FROM projects WHERE user_id = $1 AND repo_name = $2",
                db_user_id, project_name
            )

            if existing:
                raise HTTPException(
                    status_code=409,
                    detail=f"Project '{project_name}' already exists"
                )

            project_id = await conn.fetchval(
                """
                INSERT INTO projects (user_id, repo_name, repo_owner, repo_url, project_source, upload_metadata, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                RETURNING id
                """,
                db_user_id,
                project_name,
                user.email or "uploaded",
                f"upload://{project_name}",
                'upload',
                validation_result
            )

            for i, file_meta in enumerate(files_metadata):
                await conn.execute(
                    """
                    INSERT INTO project_files (project_id, filename, file_size, file_hash, mime_type, upload_order)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    """,
                    project_id,
                    file_meta['filename'],
                    file_meta['size'],
                    file_meta['hash'],
                    file_meta['mime_type'],
                    i
                )

            print(f"✅ API: Created project with ID {project_id}")

        finally:
            await conn.close()

        total_time = (time.time() - operation_start) * 1000
        print(f"🎉 API: Upload completed successfully in {total_time:.2f}ms")

        return FileUploadResponse(
            project_id=project_id,
            project_name=project_name,
            files_processed=len(files_metadata),
            total_size_bytes=total_size,
            validation_results=validation_result,
            created_at=time.strftime('%Y-%m-%dT%H:%M:%SZ')
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ API: Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Upload processing failed")

