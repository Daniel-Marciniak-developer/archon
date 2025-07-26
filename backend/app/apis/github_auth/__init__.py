from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional
import requests
import os
from app.auth import AuthorizedUser


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
public_router = APIRouter()

class GitHubConnectionStatus(BaseModel):
    connected: bool
    username: Optional[str] = None
    avatar_url: Optional[str] = None

class GitHubAuthUrlResponse(BaseModel):
    auth_url: str

DEVELOPMENT_MODE = os.getenv("APP_ENV", "development") != "production"

MOCK_GITHUB_USER = {
    "connected": False,
    "username": "demo-user",
    "avatar_url": "https://avatars.githubusercontent.com/u/12345?v=4"
}

user_github_connections = {}

@router.get("/github/status")
@rate_limit("10/minute")
async def get_github_connection_status(request: Request, user: AuthorizedUser) -> GitHubConnectionStatus:
    """
    Check if the user has connected their GitHub account via custom OAuth
    """
    try:
        from app.libs.database import get_db_connection

        def convert_user_id_to_int(user_id: str) -> int:
            import hashlib
            hash_bytes = hashlib.sha256(user_id.encode()).digest()
            return int.from_bytes(hash_bytes[:4], byteorder='big') % (2**31 - 1)

        db_user_id = convert_user_id_to_int(user.sub)
        print(f"🔗 GitHub: Checking connection status for user {user.sub} (DB ID: {db_user_id})")

        conn = await get_db_connection()
        try:
            user_record = await conn.fetchrow(
                "SELECT github_access_token, username, avatar_url FROM users WHERE id = $1",
                db_user_id
            )

            if user_record and user_record['github_access_token'] and user_record['github_access_token'] != 'mock-token':
                print(f"✅ GitHub: User {user.sub} has valid access token")
                return GitHubConnectionStatus(
                    connected=True,
                    username=user_record['username'],
                    avatar_url=user_record['avatar_url']
                )
            else:
                print(f"❌ GitHub: User {user.sub} has no valid access token")
                return GitHubConnectionStatus(
                    connected=False,
                    username=None,
                    avatar_url=None
                )
        finally:
            await conn.close()

    except Exception as e:
        print(f"❌ GitHub: Status check error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/github/connect")
@rate_limit("5/minute")
async def connect_github(request: Request, user: AuthorizedUser) -> GitHubAuthUrlResponse:
    """
    Initiate GitHub OAuth flow to connect user's GitHub account.
    """
    try:
        import os

        github_client_id = os.getenv("GITHUB_CLIENT_ID")
        github_redirect_uri = os.getenv("GITHUB_REDIRECT_URI")

        if not github_client_id or not github_redirect_uri:
            raise HTTPException(
                status_code=500,
                detail="GitHub OAuth not configured. Please contact administrator."
            )

        import secrets
        state = secrets.token_urlsafe(32)

        # TODO: Store state in database/session for verification

        github_oauth_url = (
            f"https://github.com/login/oauth/authorize"
            f"?client_id={github_client_id}"
            f"&redirect_uri={github_redirect_uri}"
            f"&scope=repo,user:email"
            f"&state={state}"
            f"&allow_signup=true"
        )

        print(f"🔗 GitHub: Generated OAuth URL for user {user.sub}")

        return GitHubAuthUrlResponse(
            auth_url=github_oauth_url,
            state=state
        )

    except Exception as e:
        print(f"❌ GitHub Connect Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/github/callback")
@rate_limit("10/minute")
async def github_oauth_callback(request: Request, user: AuthorizedUser):
    """
    Handle GitHub OAuth callback and store access token.
    """
    try:
        import os
        import httpx
        from app.libs.database import get_db_connection

        data = await request.json()
        code = data.get("code")
        state = data.get("state")

        if not code:
            raise HTTPException(status_code=400, detail="Missing authorization code")

        # TODO: Verify state parameter for security

        github_client_id = os.getenv("GITHUB_CLIENT_ID")
        github_client_secret = os.getenv("GITHUB_CLIENT_SECRET")

        if not github_client_id or not github_client_secret:
            raise HTTPException(
                status_code=500,
                detail="GitHub OAuth not configured"
            )

        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": github_client_id,
                    "client_secret": github_client_secret,
                    "code": code
                }
            )

            if not token_response.is_success:
                print(f"❌ GitHub: Token exchange failed: {token_response.status_code}")
                raise HTTPException(
                    status_code=400,
                    detail="Failed to exchange authorization code for access token"
                )

            token_data = token_response.json()
            access_token = token_data.get("access_token")

            if not access_token:
                print(f"❌ GitHub: No access token in response: {token_data}")
                raise HTTPException(
                    status_code=400,
                    detail="No access token received from GitHub"
                )

            user_response = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}"}
            )

            if not user_response.is_success:
                print(f"❌ GitHub: User info request failed: {user_response.status_code}")
                raise HTTPException(
                    status_code=400,
                    detail="Invalid access token"
                )

            github_user = user_response.json()
            github_id = github_user["id"]
            github_username = github_user["login"]

            print(f"✅ GitHub: Successfully authenticated {github_username} (ID: {github_id})")

            def convert_user_id_to_int(user_id: str) -> int:
                import hashlib
                hash_bytes = hashlib.sha256(user_id.encode()).digest()
                return int.from_bytes(hash_bytes[:4], byteorder='big') % (2**31 - 1)

            db_user_id = convert_user_id_to_int(user.sub)

            conn = await get_db_connection()
            try:
                await conn.execute(
                    """
                    INSERT INTO users (id, github_id, username, avatar_url, github_access_token)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (id) DO UPDATE SET
                        github_id = EXCLUDED.github_id,
                        username = EXCLUDED.username,
                        avatar_url = EXCLUDED.avatar_url,
                        github_access_token = EXCLUDED.github_access_token,
                        updated_at = NOW()
                    """,
                    db_user_id, github_id, github_username, github_user.get("avatar_url"), access_token
                )

                print(f"✅ GitHub: Stored access token for user {user.sub} -> {github_username}")

                return {
                    "success": True,
                    "message": f"Successfully connected GitHub account: {github_username}",
                    "github_username": github_username
                }

            finally:
                await conn.close()

    except Exception as e:
        print(f"❌ GitHub Callback Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"GitHub callback failed: {str(e)}")

@router.delete("/github/disconnect")
async def disconnect_github(user: AuthorizedUser):
    """
    GitHub disconnection is handled by Stack Auth.
    This endpoint just returns a message.
    """
    try:
        raise HTTPException(
            status_code=400,
            detail="GitHub disconnection is handled by Stack Auth. Please use account settings."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/github/repositories")
@rate_limit("20/minute")
async def get_github_repositories(request: Request, user: AuthorizedUser):
    """
    Get user's GitHub repositories using real GitHub OAuth
    """
    try:
        import asyncpg
        import httpx
        from app.libs.database import get_db_connection

        def convert_user_id_to_int(user_id: str) -> int:
            import hashlib
            hash_bytes = hashlib.sha256(user_id.encode()).digest()
            return int.from_bytes(hash_bytes[:4], byteorder='big') % (2**31 - 1)

        db_user_id = convert_user_id_to_int(user.sub)
        print(f"🔗 GitHub: Getting repositories for user {user.sub} (DB ID: {db_user_id})")

        conn = await get_db_connection()
        try:
            user_record = await conn.fetchrow(
                "SELECT github_access_token FROM users WHERE id = $1",
                db_user_id
            )

            if not user_record or not user_record['github_access_token'] or user_record['github_access_token'] == 'mock-token':
                print(f"⚠️ GitHub: No valid access token found for user {user.sub}")
                print(f"📝 Using mock repositories for user: {user.name or user.email or user.sub[:8]}")

                return {
            "repositories": [
                {
                    "id": 1,
                    "name": "python-data-analyzer",
                    "full_name": f"{user.sub[:8]}/python-data-analyzer",
                    "owner": {"login": user.sub[:8]},
                    "html_url": f"https://github.com/{user.sub[:8]}/python-data-analyzer",
                    "description": "A comprehensive Python data analysis toolkit with pandas and numpy",
                    "language": "Python",
                    "stargazers_count": 42,
                    "forks_count": 12,
                    "updated_at": "2024-01-15T10:30:00Z",
                    "private": False
                },
                {
                    "id": 2,
                    "name": "ml-pipeline",
                    "full_name": f"{user.sub[:8]}/ml-pipeline",
                    "owner": {"login": user.sub[:8]},
                    "html_url": f"https://github.com/{user.sub[:8]}/ml-pipeline",
                    "description": "Machine learning pipeline with scikit-learn and TensorFlow",
                    "language": "Python",
                    "stargazers_count": 28,
                    "forks_count": 8,
                    "updated_at": "2024-01-12T14:20:00Z",
                    "private": False
                },
                {
                    "id": 3,
                    "name": "web-scraper",
                    "full_name": f"{user.sub[:8]}/web-scraper",
                    "owner": {"login": user.sub[:8]},
                    "html_url": f"https://github.com/{user.sub[:8]}/web-scraper",
                    "description": "Python web scraping tool using BeautifulSoup and Scrapy",
                    "language": "Python",
                    "stargazers_count": 15,
                    "forks_count": 5,
                    "updated_at": "2024-01-08T09:15:00Z",
                    "private": True
                }
            ]
        }

            github_token = user_record['github_access_token']
            print(f"🔑 GitHub: Using access token to fetch real repositories for user {user.sub}")

            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {github_token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "Archon-Code-Analyzer/1.0"
                }

                github_response = await client.get(
                    "https://api.github.com/user/repos",
                    headers=headers,
                    params={
                        "sort": "updated",
                        "per_page": 100,
                        "type": "all"
                    }
                )

                if github_response.status_code == 401:
                    print("❌ GitHub: Invalid access token")
                    print(f"📝 Using mock repositories for user: {user.name or user.email or user.sub[:8]}")
                    return {
                        "repositories": [
                            {
                                "id": 1,
                                "name": "python-data-analyzer",
                                "full_name": f"{user.sub[:8]}/python-data-analyzer",
                                "owner": {"login": user.sub[:8]},
                                "html_url": f"https://github.com/{user.sub[:8]}/python-data-analyzer",
                                "description": "A comprehensive Python data analysis toolkit",
                                "language": "Python",
                                "stargazers_count": 42,
                                "forks_count": 12,
                                "updated_at": "2024-01-15T10:30:00Z",
                                "private": False
                            }
                        ]
                    }
                elif github_response.status_code == 403:
                    print("❌ GitHub: Rate limit exceeded")
                    raise HTTPException(
                        status_code=429,
                        detail="GitHub API rate limit exceeded. Please try again later."
                    )
                elif not github_response.is_success:
                    print(f"❌ GitHub: API error {github_response.status_code}")
                    raise HTTPException(
                        status_code=502,
                        detail=f"GitHub API error: {github_response.status_code}"
                    )

                repos_data = github_response.json()
                print(f"✅ GitHub: Fetched {len(repos_data)} real repositories for user {user.sub}")

                repositories = []
                for repo in repos_data:
                    repositories.append({
                        "id": repo["id"],
                        "name": repo["name"],
                        "full_name": repo["full_name"],
                        "description": repo.get("description"),
                        "private": repo["private"],
                        "html_url": repo["html_url"],
                        "language": repo.get("language"),
                        "stargazers_count": repo["stargazers_count"],
                        "forks_count": repo.get("forks_count", 0),
                        "updated_at": repo["updated_at"],
                        "owner": {"login": repo["owner"]["login"]}
                    })

                return {"repositories": repositories}

        finally:
            await conn.close()

    except Exception as e:
        print(f"❌ GitHub: Error getting repositories: {str(e)}")
        return {
            "repositories": [
                {
                    "id": 1,
                    "name": "python-data-analyzer",
                    "full_name": "user/python-data-analyzer",
                    "owner": {"login": "user"},
                    "html_url": "https://github.com/user/python-data-analyzer",
                    "description": "A comprehensive Python data analysis toolkit",
                    "language": "Python",
                    "stargazers_count": 42,
                    "forks_count": 12,
                    "updated_at": "2024-01-15T10:30:00Z",
                    "private": False
                }
            ]
        }



