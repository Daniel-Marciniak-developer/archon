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
    # The subject, or user ID, from the authenticated token
    sub: str

    # Optional extra user data
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
    return getattr(request.app.state.databutton_app_state, "audit_log", None)


AuditLogDep = Annotated[Callable[[str], None] | None, Depends(get_audit_log)]


def get_authorized_user(
    request: HTTPConnection,
) -> User:
    auth_config = get_auth_config(request)

    try:
        if isinstance(request, WebSocket):
            user = authorize_websocket(request, auth_config)
        elif isinstance(request, Request):
            user = authorize_request(request, auth_config)
        else:
            raise ValueError("Unexpected request type")

        if user is not None:
            return user
        print("Request authentication returned no user")
    except Exception as e:
        print(f"Request authentication failed: {e}")

    if isinstance(request, WebSocket):
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION, reason="Not authenticated"
        )
    else:
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED, detail="Not authenticated"
        )


def get_jwks_client(url: str):
    """Create PyJWKClient with cache."""
    return PyJWKClient(url, cache_keys=True)


def get_signing_key(url: str, token: str) -> tuple[str, str]:
    """Get signing key with manual JWKS fetching as fallback"""
    client = get_jwks_client(url)
    try:
        signing_key = client.get_signing_key_from_jwt(token)
        key = signing_key.key
    except Exception as e:
        print(f"Failed to get signing key from PyJWKClient: {e}")
        # Manual JWKS fetching as fallback
        try:
            import httpx
            import jwt

            # Get token header to find kid
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get('kid')
            print(f"Looking for kid: {kid}")

            # Fetch JWKS manually
            with httpx.Client() as http_client:
                response = http_client.get(url)
                response.raise_for_status()
                jwks = response.json()

            print(f"JWKS response: {jwks}")

            # Find matching key
            available_kids = [key.get('kid') for key in jwks.get('keys', [])]
            print(f"Available kids: {available_kids}")

            for key_data in jwks.get('keys', []):
                key_kid = key_data.get('kid')
                print(f"Checking key with kid: '{key_kid}' vs looking for: '{kid}'")
                if key_kid == kid:
                    print(f"✅ Found matching key for kid: {kid}")
                    # Convert JWK to PEM format for ES256
                    from jwt.algorithms import ECAlgorithm
                    key = ECAlgorithm.from_jwk(key_data)
                    alg = key_data.get('alg', 'ES256')
                    return (key, alg)

            # If no matching kid found, try with the first available key as fallback
            if jwks.get('keys'):
                print(f"⚠️ No matching kid found, trying fallback with first available key")
                fallback_key = jwks['keys'][0]
                from jwt.algorithms import ECAlgorithm
                key = ECAlgorithm.from_jwk(fallback_key)
                alg = fallback_key.get('alg', 'ES256')
                return (key, alg)

            raise Exception(f"No key found for kid: '{kid}', available: {available_kids}")

        except Exception as manual_error:
            print(f"❌ Manual JWKS fetch also failed: {manual_error}")
            raise manual_error

    # Try to get algorithm from the key itself
    try:
        # Check if the signing_key has an 'alg' attribute
        if hasattr(signing_key, 'alg'):
            alg = signing_key.alg
        else:
            # Fallback: decode token header to get algorithm
            import jwt
            unverified_header = jwt.get_unverified_header(token)
            alg = unverified_header.get('alg', 'RS256')

        print(f"Using algorithm: {alg}")
        return (key, alg)
    except Exception as e:
        print(f"Error getting algorithm: {e}")
        # Default fallback
        return (key, "RS256")


def authorize_websocket(
    request: WebSocket,
    auth_config: AuthConfig,
) -> User | None:
    # Parse Sec-Websocket-Protocol
    header = "Sec-Websocket-Protocol"
    sep = ","
    prefix = "Authorization.Bearer."
    protocols_header = request.headers.get(header)
    protocols = (
        [h.strip() for h in protocols_header.split(sep)] if protocols_header else []
    )

    token: str | None = None
    for p in protocols:
        if p.startswith(prefix):
            token = p.removeprefix(prefix)
            break

    if not token:
        print(f"Missing bearer {prefix}.<token> in protocols")
        return None

    return authorize_token(token, auth_config)


def authorize_request(
    request: Request,
    auth_config: AuthConfig,
) -> User | None:
    auth_header = request.headers.get(auth_config.header)
    if not auth_header:
        print(f"Missing header '{auth_config.header}'")
        return None

    token = auth_header.startswith("Bearer ") and auth_header[7:]
    if not token:
        print(f"Missing bearer token in '{auth_config.header}'")
        return None

    return authorize_token(token, auth_config)


def authorize_token(
    token: str,
    auth_config: AuthConfig,
) -> User | None:
    # Audience and jwks url to get signing key from based on the users config
    jwks_urls = [(auth_config.audience, auth_config.jwks_url)]

    payload = None
    for audience, jwks_url in jwks_urls:
        try:
            key, alg = get_signing_key(jwks_url, token)
        except Exception as e:
            print(f"Failed to get signing key {e}")
            continue

        try:
            print(f"Attempting to decode token with audience: {audience}, algorithm: {alg}")
            payload = jwt.decode(
                token,
                key=key,
                algorithms=[alg],
                audience=audience,
            )
            print(f"Successfully decoded token, payload keys: {list(payload.keys()) if payload else 'None'}")
        except jwt.PyJWTError as e:
            print(f"Failed to decode and validate token {e}")
            continue

    try:
        user = User.model_validate(payload)
        print(f"User {user.sub} authenticated")
        return user
    except Exception as e:
        print(f"Failed to parse token payload {e}")
        return None
