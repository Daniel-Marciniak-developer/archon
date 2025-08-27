import os
import pathlib
import json
import dotenv
from fastapi import FastAPI, APIRouter, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
dotenv.load_dotenv()
from app.auth.middleware import AuthConfig, get_authorized_user
from app.config import settings
from app.middleware.security import SecurityHeadersMiddleware, RequestLoggingMiddleware
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    limiter = Limiter(key_func=get_remote_address)
    RATE_LIMITING_AVAILABLE = True
except ImportError:
    limiter = None
    RATE_LIMITING_AVAILABLE = False
def get_router_config() -> dict:
    try:
        cfg = json.loads(open("routers.json").read())
    except:
        return False
    return cfg
def is_auth_disabled(router_config: dict, name: str) -> bool:
    return router_config["routers"][name]["disableAuth"]
def import_api_routers() -> APIRouter:
    routes = APIRouter()
    router_config = get_router_config()
    src_path = pathlib.Path(__file__).parent
    apis_path = src_path / "app" / "apis"
    api_names = [
        p.relative_to(apis_path).parent.as_posix()
        for p in apis_path.glob("*/__init__.py")
    ]
    api_module_prefix = "app.apis."
    for name in api_names:
        try:
            api_module = __import__(api_module_prefix + name, fromlist=[name])
            api_router = getattr(api_module, "router", None)
            if isinstance(api_router, APIRouter):
                routes.include_router(
                    api_router,
                    dependencies=(
                        []
                        if is_auth_disabled(router_config, name)
                        else [Depends(get_authorized_user)]
                    ),
                )
            public_router = getattr(api_module, "public_router", None)
            if isinstance(public_router, APIRouter):
                routes.include_router(public_router)
        except Exception as e:
            print(f"❌ Error loading router {name}: {e}")
            import traceback
            traceback.print_exc()
            continue
    return routes
def get_stack_auth_config() -> dict | None:
    project_id = os.environ.get("STACK_AUTH_PROJECT_ID")
    publishable_key = os.environ.get("STACK_AUTH_PUBLISHABLE_CLIENT_KEY")
    jwks_url = os.environ.get("STACK_AUTH_JWKS_URL")
    
    print(f"DEBUG: Stack Auth config - project_id: {project_id}, jwks_url: {jwks_url}")
    
    return {
        "projectId": project_id,
        "publishableClientKey": publishable_key,
        "jwksUrl": jwks_url,
    }
def create_app() -> FastAPI:
    is_production = settings.is_production
    app = FastAPI(
        title="Archon Code Analysis API",
        description="Secure code analysis platform",
        version="1.0.0",
        docs_url="/docs" if not is_production else None,
        redoc_url="/redoc" if not is_production else None,
    )
    if RATE_LIMITING_AVAILABLE:
        app.state.limiter = limiter
        app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ]
    if is_production:
        if settings.production_domain:
            allowed_origins.extend([
                f"https://{settings.production_domain}",
                f"https://www.{settings.production_domain}"
            ])
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )
    if is_production:
        trusted_hosts = ["localhost", "127.0.0.1"]
        if settings.production_domain:
            trusted_hosts.extend([settings.production_domain, f"www.{settings.production_domain}"])
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=trusted_hosts)
        app.add_middleware(SecurityHeadersMiddleware)
        app.add_middleware(RequestLoggingMiddleware)
    app.include_router(import_api_routers())
    stack_auth_config = get_stack_auth_config()
    firebase_config = None
    if stack_auth_config is not None:
        auth_config = {
            "jwks_url": stack_auth_config["jwksUrl"],
            "audience": stack_auth_config["projectId"],
            "header": "authorization",
        }
        app.state.auth_config = AuthConfig(**auth_config)
    elif firebase_config is not None:
        auth_config = {
            "jwks_url": "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
            "audience": firebase_config["projectId"],
            "header": "authorization",
        }
        app.state.auth_config = AuthConfig(**auth_config)
    else:
        app.state.auth_config = None
    return app
app = create_app()
