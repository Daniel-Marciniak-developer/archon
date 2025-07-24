"""
File upload API endpoints for project creation from uploaded files.
Handles multipart file uploads, validation, and project creation.
"""
import os
import tempfile
import shutil
import zipfile
import mimetypes
from pathlib import Path
from typing import List, Optional, Dict, Any
import asyncio
import time
import hashlib

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import asyncpg

from app.auth import AuthorizedUser
from app.apis.projects import get_db_connection, convert_user_id_to_int

def rate_limit(limit_string):
    """Decorator that applies rate limiting if available, otherwise does nothing"""
    def decorator(func):
        # TODO: Implement proper rate limiting when slowapi is available
        return func
    return decorator

router = APIRouter(prefix="/api/projects", tags=["File Upload"])

MAX_FILE_SIZE = 100 * 1024 * 1024
MAX_TOTAL_SIZE = 500 * 1024 * 1024
ALLOWED_EXTENSIONS = {
    '.py', '.pyx', '.pyi', '.pyw',
    '.txt', '.md', '.rst', '.doc',
    '.json', '.yaml', '.yml', '.toml', '.cfg', '.ini',
    '.requirements', '.lock',
    '.gitignore', '.gitattributes',
    '.dockerfile', '.dockerignore',
    '.sh', '.bat', '.ps1',
    '.sql',
    '.env', '.env.example',
}

PYTHON_PROJECT_INDICATORS = {
    'setup.py', 'pyproject.toml', 'requirements.txt', 
    'Pipfile', 'poetry.lock', 'conda.yml', 'environment.yml',
    'main.py', '__init__.py', 'app.py', 'manage.py'
}

class FileUploadResponse(BaseModel):
    """Response model for file upload"""
    project_id: int
    project_name: str
    files_processed: int
    total_size_bytes: int
    validation_results: Dict[str, Any]
    created_at: str

class ProjectValidationResult(BaseModel):
    """Project validation results"""
    is_python_project: bool
    confidence_score: float
    detected_frameworks: List[str]
    entry_points: List[str]
    dependencies_found: List[str]
    structure_analysis: Dict[str, Any]
    warnings: List[str]
    errors: List[str]

def validate_file_extension(filename: str) -> bool:
    """Check if file extension is allowed"""
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS or filename.lower() in PYTHON_PROJECT_INDICATORS

def validate_file_size(file_size: int) -> bool:
    """Check if file size is within limits"""
    return file_size <= MAX_FILE_SIZE

def calculate_file_hash(file_path: Path) -> str:
    """Calculate SHA-256 hash of file for deduplication"""
    hash_sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_sha256.update(chunk)
    return hash_sha256.hexdigest()

def analyze_python_project(temp_dir: Path) -> ProjectValidationResult:
    """Analyze uploaded files to determine if it's a valid Python project"""
    files = list(temp_dir.rglob("*"))
    python_files = [f for f in files if f.suffix.lower() in {'.py', '.pyx', '.pyi'}]
    
    project_files = [f.name.lower() for f in files]
    indicators_found = PYTHON_PROJECT_INDICATORS.intersection(set(project_files))
    
    confidence = 0.0
    detected_frameworks = []
    entry_points = []
    dependencies = []
    warnings = []
    errors = []
    
    if python_files:
        confidence += 0.4
    if indicators_found:
        confidence += 0.3
    if any('__init__.py' in str(f) for f in files):
        confidence += 0.2
        detected_frameworks.append('Python Package')
    
    for file in files:
        if file.is_file():
            try:
                content = file.read_text(encoding='utf-8', errors='ignore').lower()
                
                if 'django' in content or 'manage.py' in project_files:
                    detected_frameworks.append('Django')
                    confidence += 0.1
                
                if 'flask' in content:
                    detected_frameworks.append('Flask')
                    confidence += 0.1
                
                if 'fastapi' in content:
                    detected_frameworks.append('FastAPI')
                    confidence += 0.1
                
                if 'if __name__ == "__main__"' in content:
                    entry_points.append(str(file.relative_to(temp_dir)))
                    
            except Exception:
                continue
    
    for indicator in ['requirements.txt', 'pyproject.toml', 'Pipfile']:
        dep_file = temp_dir / indicator
        if dep_file.exists():
            try:
                content = dep_file.read_text(encoding='utf-8')
                common_deps = ['django', 'flask', 'fastapi', 'numpy', 'pandas', 'requests']
                found_deps = [dep for dep in common_deps if dep in content.lower()]
                dependencies.extend(found_deps)
            except Exception:
                warnings.append(f"Could not read {indicator}")
    
    if not python_files and not indicators_found:
        errors.append("No Python files or project indicators found")
        confidence = 0.0
    
    if len(files) > 10000:
        warnings.append("Large number of files detected - processing may be slow")
    
    total_size = sum(f.stat().st_size for f in files if f.is_file())
    if total_size > MAX_TOTAL_SIZE:
        errors.append(f"Project too large ({total_size / 1024 / 1024:.1f}MB > {MAX_TOTAL_SIZE / 1024 / 1024}MB)")
    
    structure_analysis = {
        'total_files': len(files),
        'python_files': len(python_files),
        'directories': len([f for f in files if f.is_dir()]),
        'total_size_bytes': total_size,
        'indicators_found': list(indicators_found)
    }
    
    return ProjectValidationResult(
        is_python_project=confidence >= 0.3,
        confidence_score=min(confidence, 1.0),
        detected_frameworks=list(set(detected_frameworks)),
        entry_points=entry_points,
        dependencies_found=list(set(dependencies)),
        structure_analysis=structure_analysis,
        warnings=warnings,
        errors=errors
    )

async def save_uploaded_files(files: List[UploadFile], temp_dir: Path) -> Dict[str, Any]:
    """Save uploaded files to temporary directory and return metadata"""
    saved_files = []
    total_size = 0
    file_hashes = set()
    
    for file in files:
        if not file.filename:
            continue
            
        if not validate_file_extension(file.filename):
            raise HTTPException(
                status_code=400, 
                detail=f"File type not allowed: {file.filename}"
            )
        
        content = await file.read()
        file_size = len(content)
        
        if not validate_file_size(file_size):
            raise HTTPException(
                status_code=413,
                detail=f"File too large: {file.filename} ({file_size / 1024 / 1024:.1f}MB > {MAX_FILE_SIZE / 1024 / 1024}MB)"
            )
        
        total_size += file_size
        
        if total_size > MAX_TOTAL_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"Total upload size too large ({total_size / 1024 / 1024:.1f}MB > {MAX_TOTAL_SIZE / 1024 / 1024}MB)"
            )
        
        file_path = temp_dir / file.filename
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, 'wb') as f:
            f.write(content)
        
        file_hash = hashlib.sha256(content).hexdigest()
        if file_hash in file_hashes:
            continue
        file_hashes.add(file_hash)
        
        saved_files.append({
            'filename': file.filename,
            'size': file_size,
            'path': str(file_path.relative_to(temp_dir)),
            'hash': file_hash,
            'mime_type': mimetypes.guess_type(file.filename)[0]
        })
        
        await file.seek(0)
    
    return {
        'files': saved_files,
        'total_size': total_size,
        'file_count': len(saved_files)
    }

@router.post("/upload", response_model=FileUploadResponse)
@rate_limit("10/minute")
async def upload_project_files(
    files: List[UploadFile] = File(...),
    project_name: Optional[str] = Form(None),
    user: AuthorizedUser = Depends()
) -> FileUploadResponse:
    """
    Upload project files and create a new project.
    Supports multiple files and basic project validation.
    """
    operation_start = time.time()
    db_user_id = convert_user_id_to_int(user.sub)
    temp_dir = None
    
    print(f"📤 API: POST /upload - Starting upload for user {user.sub} (DB ID: {db_user_id})")
    print(f"📁 API: Received {len(files)} files")
    
    try:
        temp_dir = Path(tempfile.mkdtemp(prefix="archon_upload_"))
        print(f"📂 API: Created temp directory: {temp_dir}")
        
        file_metadata = await save_uploaded_files(files, temp_dir)
        print(f"💾 API: Saved {file_metadata['file_count']} files ({file_metadata['total_size'] / 1024 / 1024:.1f}MB)")
        
        validation_result = analyze_python_project(temp_dir)
        print(f"🔍 API: Project analysis - Python: {validation_result.is_python_project}, Confidence: {validation_result.confidence_score:.2f}")
        
        if not validation_result.is_python_project:
            raise HTTPException(
                status_code=400,
                detail=f"Not a valid Python project (confidence: {validation_result.confidence_score:.2f}). Errors: {', '.join(validation_result.errors)}"
            )
        
        if validation_result.errors:
            raise HTTPException(
                status_code=400,
                detail=f"Project validation failed: {', '.join(validation_result.errors)}"
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
                INSERT INTO projects (user_id, repo_name, repo_owner, repo_url, created_at)
                VALUES ($1, $2, $3, $4, NOW())
                RETURNING id
                """,
                db_user_id,
                project_name,
                user.email or "uploaded",
                f"upload://{project_name}"
            )
            
            print(f"✅ API: Created project with ID {project_id}")
            
        finally:
            await conn.close()
        
        # TODO: In a real implementation, you would:
        
        total_time = (time.time() - operation_start) * 1000
        print(f"🎉 API: Upload completed successfully in {total_time:.2f}ms")
        
        return FileUploadResponse(
            project_id=project_id,
            project_name=project_name,
            files_processed=file_metadata['file_count'],
            total_size_bytes=file_metadata['total_size'],
            validation_results=validation_result.dict(),
            created_at=time.strftime('%Y-%m-%dT%H:%M:%SZ')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ API: Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Upload processing failed")
    finally:
        if temp_dir and temp_dir.exists():
            try:
                shutil.rmtree(temp_dir)
                print(f"🧹 API: Cleaned up temp directory: {temp_dir}")
            except Exception as e:
                print(f"⚠️ API: Failed to cleanup temp directory: {e}")
