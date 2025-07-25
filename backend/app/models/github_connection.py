from datetime import datetime
from typing import Optional
from pydantic import BaseModel
class GitHubConnection(BaseModel):
    user_id: str
    github_user_id: int
    username: str
    avatar_url: Optional[str] = None
    access_token: str
    created_at: datetime
    updated_at: datetime
class GitHubConnectionCreate(BaseModel):
    user_id: str
    github_user_id: int
    username: str
    avatar_url: Optional[str] = None
    access_token: str
class GitHubConnectionUpdate(BaseModel):
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    access_token: Optional[str] = None
    updated_at: Optional[datetime] = None
github_connections_db: dict[str, GitHubConnection] = {}
def get_github_connection(user_id: str) -> Optional[GitHubConnection]:
    return github_connections_db.get(user_id)
def create_github_connection(connection_data: GitHubConnectionCreate) -> GitHubConnection:
    connection = GitHubConnection(
        **connection_data.dict(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    github_connections_db[connection_data.user_id] = connection
    return connection
def update_github_connection(user_id: str, update_data: GitHubConnectionUpdate) -> Optional[GitHubConnection]:
    if user_id not in github_connections_db:
        return None
    connection = github_connections_db[user_id]
    update_dict = update_data.dict(exclude_unset=True)
    update_dict['updated_at'] = datetime.utcnow()
    for field, value in update_dict.items():
        setattr(connection, field, value)
    return connection
def delete_github_connection(user_id: str) -> bool:
    if user_id in github_connections_db:
        del github_connections_db[user_id]
        return True
    return False
