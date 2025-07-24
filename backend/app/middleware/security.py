"""
Security middleware for production deployment.
Enhanced with file upload security, rate limiting, and monitoring.
"""
import time
import os
from typing import Callable, Dict, Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://api.stack-auth.com; "
            "frame-ancestors 'none';"
        )
        response.headers["Content-Security-Policy"] = csp
        
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Enhanced request logging and security monitoring."""

    def __init__(self, app):
        super().__init__(app)
        self.request_counts: Dict[str, Dict[str, int]] = {}
        self.last_cleanup = time.time()
        self.production_mode = os.getenv("APP_ENV", "development") == "production"

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        client_ip = self.get_client_ip(request)

        if await self.check_rate_limit(request, client_ip):
            print(f"🛑 SECURITY: Rate limit exceeded for {client_ip} on {request.url.path}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please try again later."}
            )

        validation_error = self.validate_request_security(request)
        if validation_error:
            print(f"🚨 SECURITY: Invalid request from {client_ip}: {validation_error}")
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid request"}
            )

        user_agent = request.headers.get("user-agent", "unknown")[:100]
        print(f"📝 REQUEST: {request.method} {request.url.path} from {client_ip}")

        response = await call_next(request)

        processing_time = time.time() - start_time
        print(f"📤 RESPONSE: {response.status_code} ({processing_time:.3f}s)")

        if processing_time > 5:
            print(f"⚠️ SLOW REQUEST: {processing_time:.2f}s for {request.url.path}")

        if time.time() - self.last_cleanup > 60:
            await self.cleanup_rate_limit_data()
            self.last_cleanup = time.time()

        return response

    def get_client_ip(self, request: Request) -> str:
        """Get client IP address with proxy support"""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        return request.client.host if request.client else "unknown"

    async def check_rate_limit(self, request: Request, client_ip: str) -> bool:
        """Enhanced rate limiting with different limits per endpoint"""
        current_time = int(time.time())
        minute_window = current_time // 60

        if client_ip not in self.request_counts:
            self.request_counts[client_ip] = {}

        client_data = self.request_counts[client_ip]
        current_count = client_data.get(minute_window, 0)

        path = request.url.path
        if "/upload" in path:
            limit = 3 if self.production_mode else 10
        elif "/api/projects" in path:
            limit = 30 if self.production_mode else 60
        elif "/api/" in path:
            limit = 60 if self.production_mode else 120
        else:
            limit = 100

        if current_count >= limit:
            return True

        client_data[minute_window] = current_count + 1
        return False

    def validate_request_security(self, request: Request) -> Optional[str]:
        """Enhanced security validation"""
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
                max_size = 200 * 1024 * 1024 if self.production_mode else 500 * 1024 * 1024
                if size > max_size:
                    return f"Request too large: {size} bytes"
            except ValueError:
                return "Invalid content-length header"

        path = str(request.url.path)
        if "../" in path or "..%2f" in path.lower() or "..%5c" in path.lower():
            return "Directory traversal attempt"

        user_agent = request.headers.get("user-agent", "").lower()
        suspicious_agents = ["sqlmap", "nikto", "nmap", "masscan", "zap"]
        if any(agent in user_agent for agent in suspicious_agents):
            return "Suspicious user agent detected"

        suspicious_headers = ["x-forwarded-host", "x-original-url", "x-rewrite-url"]
        for header in suspicious_headers:
            if header in request.headers:
                return f"Suspicious header: {header}"

        return None

    async def cleanup_rate_limit_data(self):
        """Clean up old rate limiting data"""
        current_time = int(time.time())
        minute_window = current_time // 60

        for client_ip in list(self.request_counts.keys()):
            client_data = self.request_counts[client_ip]
            old_windows = [w for w in client_data.keys() if w < minute_window - 10]
            for old_window in old_windows:
                del client_data[old_window]
            if not client_data:
                del self.request_counts[client_ip]


class FileUploadSecurityValidator:
    """Security validator specifically for file uploads"""

    @staticmethod
    def log_upload_attempt(client_ip: str, user_id: str, file_count: int, total_size: int):
        """Log file upload attempt with security context"""
        print(f"🔒 UPLOAD ATTEMPT: IP: {client_ip}, User: {user_id}, "
              f"Files: {file_count}, Size: {total_size / 1024 / 1024:.1f}MB")

        if total_size > 100 * 1024 * 1024:
            print(f"⚠️ LARGE UPLOAD: {total_size / 1024 / 1024:.1f}MB from {client_ip}")

    @staticmethod
    def log_validation_failure(client_ip: str, user_id: str, filename: str, reason: str):
        """Log validation failure for security monitoring"""
        print(f"🚨 VALIDATION FAILED: IP: {client_ip}, User: {user_id}, "
              f"File: {filename}, Reason: {reason}")

    @staticmethod
    def log_suspicious_content(client_ip: str, user_id: str, filename: str, pattern: str):
        """Log suspicious content detection"""
        print(f"🚨 SUSPICIOUS CONTENT: IP: {client_ip}, User: {user_id}, "
              f"File: {filename}, Pattern: {pattern}")


def log_security_event(event_type: str, client_ip: str, details: str):
    """Log security events for monitoring"""
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    print(f"🔒 SECURITY [{timestamp}]: {event_type} from {client_ip} - {details}")

def check_production_security():
    """Check if production security measures are properly configured"""
    issues = []

    if os.getenv("APP_ENV") != "production":
        issues.append("APP_ENV not set to production")

    if not os.getenv("SECRET_KEY"):
        issues.append("SECRET_KEY not configured")

    if not os.getenv("DATABASE_URL"):
        issues.append("DATABASE_URL not configured")

    return issues
