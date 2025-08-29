from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum
from uuid import UUID
class AnalysisStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
class IssueCategory(str, Enum):
    STRUCTURE = "Structure"
    QUALITY = "Quality"
    SECURITY = "Security"
    DEPENDENCIES = "Dependencies"
class IssueSeverity(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
class UserBase(BaseModel):
    github_id: int
    username: str
    avatar_url: Optional[str] = None
    github_access_token: str
class UserCreate(UserBase):
    pass
class UserUpdate(BaseModel):
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    github_access_token: Optional[str] = None
class User(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
class ProjectBase(BaseModel):
    repo_name: str = Field(..., max_length=255)
    repo_owner: str = Field(..., max_length=255)
    repo_url: str
class ProjectCreate(ProjectBase):
    user_id: UUID
class ProjectUpdate(BaseModel):
    repo_name: Optional[str] = Field(None, max_length=255)
    repo_owner: Optional[str] = Field(None, max_length=255)
    repo_url: Optional[str] = None
    last_analysis_id: Optional[int] = None
class Project(ProjectBase):
    id: int
    user_id: UUID
    last_analysis_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
class ToolName(str, Enum):
    RUFF = "ruff"
    BANDIT = "bandit"
    RADON = "radon"
    CUSTOM = "custom"
class AnalysisBase(BaseModel):
    status: AnalysisStatus = AnalysisStatus.PENDING
    overall_score: Optional[float] = Field(None, ge=0, le=100)
    structure_score: Optional[float] = Field(None, ge=0, le=100)
    quality_score: Optional[float] = Field(None, ge=0, le=100)
    security_score: Optional[float] = Field(None, ge=0, le=100)
class AnalysisCreate(BaseModel):
    project_id: int
    status: AnalysisStatus = AnalysisStatus.PENDING
class AnalysisUpdate(BaseModel):
    status: Optional[AnalysisStatus] = None
    completed_at: Optional[datetime] = None
    overall_score: Optional[float] = Field(None, ge=0, le=100)
    structure_score: Optional[float] = Field(None, ge=0, le=100)
    quality_score: Optional[float] = Field(None, ge=0, le=100)
    security_score: Optional[float] = Field(None, ge=0, le=100)
    dependencies_score: Optional[float] = Field(None, ge=0, le=100)
class Analysis(AnalysisBase):
    id: int
    project_id: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    class Config:
        from_attributes = True
class IssueBase(BaseModel):
    category: IssueCategory
    severity: IssueSeverity
    tool: ToolName
    title: str = Field(..., max_length=500)
    description: str
    file_path: str = Field(..., max_length=1000)
    line_number: int = Field(..., gt=0)
    start_line: Optional[int] = Field(None, gt=0)
    end_line: Optional[int] = Field(None, gt=0)
    start_column: Optional[int] = Field(None, ge=0)
    end_column: Optional[int] = Field(None, ge=0)
class IssueCreate(IssueBase):
    analysis_id: int
class IssueUpdate(BaseModel):
    category: Optional[IssueCategory] = None
    severity: Optional[IssueSeverity] = None
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    file_path: Optional[str] = Field(None, max_length=1000)
    line_number: Optional[int] = Field(None, gt=0)
    start_line: Optional[int] = Field(None, gt=0)
    end_line: Optional[int] = Field(None, gt=0)
    start_column: Optional[int] = Field(None, ge=0)
    end_column: Optional[int] = Field(None, ge=0)
class Issue(IssueBase):
    id: int
    analysis_id: int
    created_at: datetime
    class Config:
        from_attributes = True
class ProjectWithAnalysis(Project):
    latest_analysis: Optional[Analysis] = None
class AnalysisWithIssues(Analysis):
    issues: list[Issue] = []
class AnalysisReport(BaseModel):
    project: Project
    analysis: Analysis
    issues: list[Issue]
    issue_counts: dict[str, dict[str, int]]
class UserWithProjects(User):
    projects: list[ProjectWithAnalysis] = []
class AnalysisConfig(BaseModel):
    enable_ruff: bool = True
    enable_bandit: bool = True
    ruff_config: Optional[str] = None
    bandit_config: Optional[str] = None
