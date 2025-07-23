from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
import asyncio
from typing import List

# Optional rate limiting
try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    limiter = Limiter(key_func=get_remote_address)
    RATE_LIMITING_AVAILABLE = True
except ImportError:
    limiter = None
    RATE_LIMITING_AVAILABLE = False

def rate_limit(limit_string):
    """Decorator that applies rate limiting if available, otherwise does nothing"""
    def decorator(func):
        if RATE_LIMITING_AVAILABLE and limiter:
            return limiter.limit(limit_string)(func)
        return func
    return decorator

router = APIRouter()

class Issue(BaseModel):
    id: int
    analysis_id: int
    category: str
    severity: str
    title: str
    description: str
    file_path: str
    line_number: int

class ProjectReport(BaseModel):
    project_id: int
    project_name: str
    overall_score: float
    structure_score: float
    quality_score: float
    security_score: float
    dependencies_score: float
    issues: List[Issue]

# Mock data generation
def create_mock_report(project_id: int) -> ProjectReport:
    """Creates a more realistic mock report for a multi-file project."""
    return ProjectReport(
        project_id=project_id,
        project_name=f"archon-demo-project",
        overall_score=78.5,
        structure_score=85.0,
        quality_score=70.0,
        security_score=65.5,
        dependencies_score=95.0,
        issues=[
            Issue(id=1, analysis_id=1, category="Security", severity="High", title="Use of hardcoded password", description="The application appears to be using a hardcoded password. This is a significant security risk.", file_path="src/auth/utils.py", line_number=25),
            Issue(id=2, analysis_id=1, category="Code Quality", severity="Medium", title="Function with high cyclomatic complexity", description="The function `process_data` has a complexity of 12, which is higher than the recommended maximum of 10. Consider refactoring to simplify.", file_path="src/core/processing.py", line_number=88),
            Issue(id=3, analysis_id=1, category="Structure", severity="Low", title="Unused import", description="The `os` module is imported but never used.", file_path="src/main.py", line_number=5),
            Issue(id=4, analysis_id=1, category="Security", severity="Critical", title="SQL injection vulnerability", description="A potential SQL injection vulnerability was detected. User input is directly used to construct a SQL query without proper sanitization.", file_path="src/database/queries.py", line_number=42),
            Issue(id=5, analysis_id=1, category="Code Quality", severity="Low", title="Line too long", description="Line is 125 characters long, which exceeds the recommended 88 characters.", file_path="src/utils/helpers.py", line_number=15),
        ]
    )

@router.post("/projects/{project_id}/analyze", status_code=202)
async def start_analysis(project_id: int):
    # This is the placeholder for the long-running analysis
    print(f"Starting analysis for project {project_id}...")
    return {"message": "Analysis started"}


@router.get("/reports/{project_id}", response_model=ProjectReport)
@rate_limit("30/minute")
async def get_project_report(request: Request, project_id: int):
    # Validate project_id
    if project_id <= 0:
        raise HTTPException(status_code=400, detail="Project ID must be positive")

    # For now, we always return a fresh mock report.
    await asyncio.sleep(1) # Simulate network delay
    report = create_mock_report(project_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report



