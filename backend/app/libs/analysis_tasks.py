from app.libs.celery_worker import celery_app
from app.libs.analysis_engine import run_analysis
import os
import asyncpg
import tempfile
import shutil
import subprocess
from datetime import datetime
import asyncio

async def _update_db_with_results(analysis_id, report):
    """Coroutine to connect to DB and save results."""
    conn = None
    try:
        db_url = os.getenv("DATABASE_URL_PROD") or os.getenv("DATABASE_URL_DEV")
        if not db_url:
            raise ValueError("Database URL not found in environment variables")
        conn = await asyncpg.connect(db_url)
        async with conn.transaction():
            await conn.execute(
                """
                UPDATE analyses
                SET status = 'completed', completed_at = $1, overall_score = $2,
                    structure_score = $3, quality_score = $4, security_score = $5,
                    dependencies_score = $6
                WHERE id = $7
                """,
                datetime.utcnow(), report['overall_score'], report['structure_score'],
                report['quality_score'], report['security_score'],
                report['dependencies_score'], analysis_id
            )
            issues_data = [
                (analysis_id, issue['category'], issue['severity'], issue['title'],
                 issue['description'], issue['file_path'], issue['line_number'])
                for issue in report['issues']
            ]
            await conn.copy_records_to_table(
                'issues', records=issues_data,
                columns=('analysis_id', 'category', 'severity', 'title', 'description', 'file_path', 'line_number')
            )
    finally:
        if conn and not conn.is_closed():
            await conn.close()

@celery_app.task(bind=True)
def run_full_analysis(self, analysis_id: int, repo_url: str, github_token: str):
    """
    The main background task to perform a complete code analysis.
    """
    project_path = None
    try:
        print(f"[{analysis_id}] 🏃‍♂️ Analysis task started. Setting status to 'running'.")

        project_path = tempfile.mkdtemp()
        print(f"[{analysis_id}] 📂 Cloning {repo_url} into {project_path}...")
        
        clone_url = repo_url.replace("https://", f"https://oauth2:{github_token}@")
        subprocess.run(
            ["git", "clone", clone_url, project_path],
            check=True,
            capture_output=True
        )
        print(f"[{analysis_id}] ✅ Cloning complete.")
        
        print(f"[{analysis_id}] 🔬 Running analysis engine...")
        report = run_analysis(project_path)
        print(f"[{analysis_id}] 📊 Engine finished. Found {len(report['issues'])} issues.")

        print(f"[{analysis_id}] 💾 Saving results to the database...")
        asyncio.run(_update_db_with_results(analysis_id, report))
        print(f"[{analysis_id}] ✅ Database update complete.")

    except Exception as e:
        print(f"[{analysis_id}] ❌ ERROR during analysis: {e}")
        raise
    finally:
        if project_path and os.path.exists(project_path):
            shutil.rmtree(project_path)
            print(f"[{analysis_id}] 🧹 Cleaned up temporary directory: {project_path}")

    return {"status": "success", "issues_found": len(report['issues'])}


