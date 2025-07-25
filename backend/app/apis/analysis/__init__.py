from fastapi import APIRouter
import os
import asyncpg
import json
import tempfile
import shutil
import subprocess
from datetime import datetime
from app.libs.analysis_engine import run_analysis

router = APIRouter()

async def get_db_connection():
    """Get database connection"""
    db_url = os.getenv("DATABASE_URL_DEV")
    if not db_url:
        raise ValueError("DATABASE_URL_DEV not found in environment variables")
    return await asyncpg.connect(db_url)

async def run_real_analysis(project_id: int, analysis_id: int):
    """Run real analysis using the analysis engine"""
    conn = None
    project_path = None
    try:
        conn = await get_db_connection()
        await conn.execute(
            "UPDATE analyses SET status = 'running' WHERE id = $1",
            analysis_id
        )

        project = await conn.fetchrow(
            "SELECT repo_url, repo_name FROM projects WHERE id = $1",
            project_id
        )

        if not project:
            raise Exception(f"Project {project_id} not found")

        repo_url = project['repo_url']
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






