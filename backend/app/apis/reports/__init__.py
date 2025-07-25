from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import json
import os
from typing import List, Optional

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
    category: str
    severity: str
    title: str
    description: str
    file_path: str
    line_number: int
    tool: Optional[str] = None
    start_line: Optional[int] = None
    start_column: Optional[int] = None
    end_line: Optional[int] = None
    end_column: Optional[int] = None

class ProjectReport(BaseModel):
    project_id: int = None
    project_name: str
    overall_score: float
    structure_score: float
    quality_score: float
    security_score: float
    dependencies_score: float
    issues: List[Issue]

def clean_file_path(file_path: str) -> str:
    """Clean file path to show only repository-relative path"""
    if not file_path:
        return "unknown"

    path_parts = file_path.replace("\\", "/").split("/")
    repo_indicators = ["backend", "frontend", "src", "app"]

    for i, part in enumerate(path_parts):
        if part in repo_indicators:
            return "/".join(path_parts[i:])

    for i, part in enumerate(path_parts):
        if part == "test_project" and i + 1 < len(path_parts):
            return "/".join(path_parts[i + 1:])

    if len(path_parts) >= 2:
        return "/".join(path_parts[-2:])

    return path_parts[-1] if path_parts else "unknown"

def load_real_report_data(project_id: int) -> ProjectReport:
    """Load real analysis data from project-specific analysis report"""
    try:
        project_report_path = f"/app/analysis_reports/analysis_report_{project_id}.json"

        if os.path.exists(project_report_path):
            report_file_path = project_report_path
        else:
            report_file_path = "/app/quick_analysis_report.json"

        if not os.path.exists(report_file_path):
            return create_fallback_report(project_id)

        with open(report_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        issues = []
        for issue_data in data.get("issues", []):
            clean_path = clean_file_path(issue_data.get("file_path", "unknown"))
            issues.append(Issue(
                category=issue_data.get("category", "Unknown"),
                severity=issue_data.get("severity", "Medium"),
                title=issue_data.get("title", "Unknown Issue"),
                description=issue_data.get("description", "No description available"),
                file_path=clean_path,
                line_number=issue_data.get("line_number", 0),
                tool=issue_data.get("tool"),
                start_line=issue_data.get("start_line"),
                start_column=issue_data.get("start_column"),
                end_line=issue_data.get("end_line"),
                end_column=issue_data.get("end_column")
            ))

        severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
        issues.sort(key=lambda x: severity_order.get(x.severity, 4))

        project_name = f"Analysis Project {project_id}"
        if project_report_path == f"/app/analysis_reports/analysis_report_{project_id}.json":
            project_name = f"Real Analysis Project {project_id}"
        else:
            project_name = f"Demo Analysis Project {project_id}"

        return ProjectReport(
            project_id=project_id,
            project_name=project_name,
            overall_score=data.get("overall_score", 0.0),
            structure_score=data.get("structure_score", 0.0),
            quality_score=data.get("quality_score", 0.0),
            security_score=data.get("security_score", 0.0),
            dependencies_score=data.get("dependencies_score", 0.0),
            issues=issues
        )

    except Exception:
        return create_fallback_report(project_id)

def create_fallback_report(project_id: int) -> ProjectReport:
    """Creates a fallback mock report when real data is not available."""
    return ProjectReport(
        project_id=project_id,
        project_name=f"Archon Demo Project {project_id}",
        overall_score=78.5,
        structure_score=85.0,
        quality_score=70.0,
        security_score=65.5,
        dependencies_score=95.0,
        issues=[]
    )

@router.get("/reports/{project_id}", response_model=ProjectReport)
@rate_limit("30/minute")
async def get_project_report(request: Request, project_id: int):
    if project_id <= 0:
        raise HTTPException(status_code=400, detail="Project ID must be positive")

    report = load_real_report_data(project_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return report



