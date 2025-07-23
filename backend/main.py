import os
import pathlib
import json
import dotenv
from fastapi import FastAPI, APIRouter, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

dotenv.load_dotenv()

from databutton_app.mw.auth_mw import AuthConfig, get_authorized_user
from app.config import settings
from app.middleware.security import SecurityHeadersMiddleware, RequestLoggingMiddleware

# Optional rate limiting - graceful fallback if slowapi not available
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    limiter = Limiter(key_func=get_remote_address)
    RATE_LIMITING_AVAILABLE = True
except ImportError:
    print("⚠️ slowapi not available - rate limiting disabled")
    limiter = None
    RATE_LIMITING_AVAILABLE = False


def get_router_config() -> dict:
    try:
        # Note: This file is not available to the agent
        cfg = json.loads(open("routers.json").read())
    except:
        return False
    return cfg


def is_auth_disabled(router_config: dict, name: str) -> bool:
    return router_config["routers"][name]["disableAuth"]


def import_api_routers() -> APIRouter:
    """Create top level router including all user defined endpoints."""
    routes = APIRouter(prefix="/routes")

    router_config = get_router_config()

    src_path = pathlib.Path(__file__).parent

    # Import API routers from "src/app/apis/*/__init__.py"
    apis_path = src_path / "app" / "apis"

    api_names = [
        p.relative_to(apis_path).parent.as_posix()
        for p in apis_path.glob("*/__init__.py")
    ]

    api_module_prefix = "app.apis."

    for name in api_names:
        print(f"Importing API: {name}")
        try:
            api_module = __import__(api_module_prefix + name, fromlist=[name])

            # Include main router with auth
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

            # Include public router without auth (if exists)
            public_router = getattr(api_module, "public_router", None)
            if isinstance(public_router, APIRouter):
                routes.include_router(public_router)
        except Exception as e:
            print(e)
            continue

    print(routes.routes)

    return routes


def get_firebase_config() -> dict | None:
    extensions = os.environ.get("DATABUTTON_EXTENSIONS", "[]")
    extensions = json.loads(extensions)

    for ext in extensions:
        if ext["name"] == "firebase-auth":
            return ext["config"]["firebaseConfig"]

    return None


def get_stack_auth_config() -> dict | None:
    extensions = os.environ.get("DATABUTTON_EXTENSIONS", "[]")
    extensions = json.loads(extensions)

    for ext in extensions:
        if ext["name"] == "stack-auth":
            return ext["config"]

    return None


def create_app() -> FastAPI:
    """Create the app. This is called by uvicorn with the factory option to construct the app object."""
    # Use settings for configuration
    is_production = settings.is_production

    app = FastAPI(
        title="Archon Code Analysis API",
        description="Secure code analysis platform",
        version="1.0.0",
        docs_url="/docs" if not is_production else None,  # Disable docs in production
        redoc_url="/redoc" if not is_production else None,
    )

    # Add security middleware
    if RATE_LIMITING_AVAILABLE:
        app.state.limiter = limiter
        app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
        print("✅ Rate limiting enabled")
    else:
        print("⚠️ Rate limiting disabled - install slowapi for production")

    # CORS configuration
    allowed_origins = [
        "http://localhost:5173",  # Development frontend
        "http://localhost:5174",  # Development frontend (alternative port)
        "http://localhost:3000",  # Alternative dev port
    ]

    if is_production:
        # Add production domains
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

    # Security middleware
    if is_production:
        # Trusted host middleware
        trusted_hosts = ["localhost", "127.0.0.1"]
        if settings.production_domain:
            trusted_hosts.extend([settings.production_domain, f"www.{settings.production_domain}"])

        app.add_middleware(TrustedHostMiddleware, allowed_hosts=trusted_hosts)
        app.add_middleware(SecurityHeadersMiddleware)
        app.add_middleware(RequestLoggingMiddleware)

    app.include_router(import_api_routers())

    for route in app.routes:
        if hasattr(route, "methods"):
            for method in route.methods:
                print(f"{method} {route.path}")

    # Try Stack Auth first, then Firebase as fallback
    stack_auth_config = get_stack_auth_config()
    firebase_config = get_firebase_config()

    if stack_auth_config is not None:
        print("Stack Auth config found")
        auth_config = {
            "jwks_url": stack_auth_config["jwksUrl"],
            "audience": stack_auth_config["projectId"],
            "header": "authorization",
        }
        app.state.auth_config = AuthConfig(**auth_config)
    elif firebase_config is not None:
        print("Firebase config found")
        auth_config = {
            "jwks_url": "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
            "audience": firebase_config["projectId"],
            "header": "authorization",
        }
        app.state.auth_config = AuthConfig(**auth_config)
    else:
        print("No auth config found")
        app.state.auth_config = None

    return app


app = create_app()
