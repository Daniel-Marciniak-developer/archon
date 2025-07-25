import functools
from http import HTTPStatus
from typing import Annotated, Callable
import jwt
from fastapi import Depends, HTTPException, WebSocket, WebSocketException, status
from fastapi.requests import HTTPConnection
from jwt import PyJWKClient
from pydantic import BaseModel
from starlette.requests import Request
class AuthConfig(BaseModel):
    jwks_url: str
    audience: str
    header: str
class User(BaseModel):
    sub: str
    user_id: str | None = None
    name: str | None = None
    picture: str | None = None
    email: str | None = None
def get_auth_config(request: HTTPConnection) -> AuthConfig:
    auth_config: AuthConfig | None = request.app.state.auth_config
    if auth_config is None:
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED, detail="No auth config"
        )
    return auth_config
AuthConfigDep = Annotated[AuthConfig, Depends(get_auth_config)]
def get_audit_log(request: HTTPConnection) -> Callable[[str], None] | None:
    return getattr(request.app.state.archon_app_state, "audit_log", None)
AuditLogDep = Annotated[Callable[[str], None] | None, Depends(get_audit_log)]
def get_authorized_user(
    request: Request, auth_config: AuthConfigDep
) -> User:
    auth_header = request.headers.get(auth_config.header)
    if not auth_header:
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED, detail="Missing authorization header"
        )
    try:
        token = auth_header.split(" ")[1]
        jwks_client = PyJWKClient(auth_config.jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience=auth_config.audience,
        )
        return User(
            sub=payload["sub"],
            user_id=payload.get("user_id"),
            name=payload.get("name"),
            picture=payload.get("picture"),
            email=payload.get("email"),
        )
    except Exception as e:
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED, detail=f"Invalid token: {str(e)}"
        )
def websocket_auth_dependency(
    websocket: WebSocket, auth_config: AuthConfigDep
) -> User:
    auth_header = websocket.headers.get(auth_config.header)
    if not auth_header:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
    try:
        token = auth_header.split(" ")[1]
        jwks_client = PyJWKClient(auth_config.jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience=auth_config.audience,
        )
        return User(
            sub=payload["sub"],
            user_id=payload.get("user_id"),
            name=payload.get("name"),
            picture=payload.get("picture"),
            email=payload.get("email"),
        )
    except Exception:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
def auth_required(func):
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        return await func(*args, **kwargs)
    return wrapper
