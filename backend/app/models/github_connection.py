"""
GitHub connection model for storing user GitHub OAuth tokens.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class GitHubConnection(BaseModel):
    """Model for GitHub connection data."""
    user_id: str  # Stack Auth user ID
    github_user_id: int
    username: str
    avatar_url: Optional[str] = None
    access_token: str  # Encrypted in production
    created_at: datetime
    updated_at: datetime


class GitHubConnectionCreate(BaseModel):
    """Model for creating GitHub connection."""
    user_id: str
    github_user_id: int
    username: str
    avatar_url: Optional[str] = None
    access_token: str


class GitHubConnectionUpdate(BaseModel):
    """Model for updating GitHub connection."""
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    access_token: Optional[str] = None
    updated_at: Optional[datetime] = None


# In-memory storage for development (replace with database in production)
github_connections_db: dict[str, GitHubConnection] = {}


def get_github_connection(user_id: str) -> Optional[GitHubConnection]:
    """Get GitHub connection for user."""
    return github_connections_db.get(user_id)


def create_github_connection(connection_data: GitHubConnectionCreate) -> GitHubConnection:
    """Create new GitHub connection."""
    connection = GitHubConnection(
        **connection_data.dict(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    github_connections_db[connection_data.user_id] = connection
    return connection


def update_github_connection(user_id: str, update_data: GitHubConnectionUpdate) -> Optional[GitHubConnection]:
    """Update existing GitHub connection."""
    if user_id not in github_connections_db:
        return None
    
    connection = github_connections_db[user_id]
    update_dict = update_data.dict(exclude_unset=True)
    update_dict['updated_at'] = datetime.utcnow()
    
    for field, value in update_dict.items():
        setattr(connection, field, value)
    
    return connection


def delete_github_connection(user_id: str) -> bool:
    """Delete GitHub connection."""
    if user_id in github_connections_db:
        del github_connections_db[user_id]
        return True
    return False
