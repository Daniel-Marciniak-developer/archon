
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class AnalysisStatus(str, Enum):
    """Analysis status enumeration"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class IssueCategory(str, Enum):
    """Issue category enumeration"""
    STRUCTURE = "Structure"
    QUALITY = "Quality"
    SECURITY = "Security"
    DEPENDENCIES = "Dependencies"


class IssueSeverity(str, Enum):
    """Issue severity enumeration"""
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class UserBase(BaseModel):
    """Base user model with common fields"""
    github_id: int
    username: str
    avatar_url: Optional[str] = None
    github_access_token: str


class UserCreate(UserBase):
    """Model for creating a new user"""
    pass


class UserUpdate(BaseModel):
    """Model for updating user information"""
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    github_access_token: Optional[str] = None


class User(UserBase):
    """Complete user model with database fields"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    """Base project model with common fields"""
    repo_name: str = Field(..., max_length=255)
    repo_owner: str = Field(..., max_length=255)
    repo_url: str


class ProjectCreate(ProjectBase):
    """Model for creating a new project"""
    user_id: int


class ProjectUpdate(BaseModel):
    """Model for updating project information"""
    repo_name: Optional[str] = Field(None, max_length=255)
    repo_owner: Optional[str] = Field(None, max_length=255)
    repo_url: Optional[str] = None
    last_analysis_id: Optional[int] = None


class Project(ProjectBase):
    """Complete project model with database fields"""
    id: int
    user_id: int
    last_analysis_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AnalysisBase(BaseModel):
    """Base analysis model with common fields"""
    status: AnalysisStatus = AnalysisStatus.PENDING
    overall_score: Optional[float] = Field(None, ge=0, le=100)
    structure_score: Optional[float] = Field(None, ge=0, le=100)
    quality_score: Optional[float] = Field(None, ge=0, le=100)
    security_score: Optional[float] = Field(None, ge=0, le=100)
    dependencies_score: Optional[float] = Field(None, ge=0, le=100)


class AnalysisCreate(BaseModel):
    """Model for creating a new analysis"""
    project_id: int
    status: AnalysisStatus = AnalysisStatus.PENDING


class AnalysisUpdate(BaseModel):
    """Model for updating analysis information"""
    status: Optional[AnalysisStatus] = None
    completed_at: Optional[datetime] = None
    overall_score: Optional[float] = Field(None, ge=0, le=100)
    structure_score: Optional[float] = Field(None, ge=0, le=100)
    quality_score: Optional[float] = Field(None, ge=0, le=100)
    security_score: Optional[float] = Field(None, ge=0, le=100)
    dependencies_score: Optional[float] = Field(None, ge=0, le=100)


class Analysis(AnalysisBase):
    """Complete analysis model with database fields"""
    id: int
    project_id: int
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class IssueBase(BaseModel):
    """Base issue model with common fields"""
    category: IssueCategory
    severity: IssueSeverity
    title: str = Field(..., max_length=500)
    description: str
    file_path: str = Field(..., max_length=1000)
    line_number: int = Field(..., gt=0)


class IssueCreate(IssueBase):
    """Model for creating a new issue"""
    analysis_id: int


class IssueUpdate(BaseModel):
    """Model for updating issue information"""
    category: Optional[IssueCategory] = None
    severity: Optional[IssueSeverity] = None
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    file_path: Optional[str] = Field(None, max_length=1000)
    line_number: Optional[int] = Field(None, gt=0)


class Issue(IssueBase):
    """Complete issue model with database fields"""
    id: int
    analysis_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectWithAnalysis(Project):
    """Project model with latest analysis information"""
    latest_analysis: Optional[Analysis] = None


class AnalysisWithIssues(Analysis):
    """Analysis model with associated issues"""
    issues: list[Issue] = []


class AnalysisReport(BaseModel):
    """Complete analysis report with project info and issues"""
    project: Project
    analysis: Analysis
    issues: list[Issue]
    issue_counts: dict[str, dict[str, int]]


class UserWithProjects(User):
    """User model with associated projects"""
    projects: list[ProjectWithAnalysis] = []

