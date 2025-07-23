"""
Security configuration for production deployment.
Contains security settings, validation rules, and monitoring configurations.
"""
import os
from typing import Dict, List, Set
from pathlib import Path

# Environment-based security settings
PRODUCTION_MODE = os.getenv("APP_ENV", "development") == "production"

class SecurityConfig:
    """Centralized security configuration"""
    
    # File Upload Security
    MAX_FILE_SIZE = 50 * 1024 * 1024 if PRODUCTION_MODE else 100 * 1024 * 1024  # 50MB prod, 100MB dev
    MAX_TOTAL_SIZE = 200 * 1024 * 1024 if PRODUCTION_MODE else 500 * 1024 * 1024  # 200MB prod, 500MB dev
    MAX_FILES_COUNT = 500 if PRODUCTION_MODE else 1000  # Stricter in production
    MAX_FILENAME_LENGTH = 255
    MAX_FILEPATH_LENGTH = 1000
    
    # Rate Limiting (requests per minute)
    UPLOAD_RATE_LIMIT = "3/minute" if PRODUCTION_MODE else "10/minute"
    API_RATE_LIMIT = "60/minute" if PRODUCTION_MODE else "120/minute"
    GITHUB_RATE_LIMIT = "20/minute"
    
    # Allowed file extensions - very restrictive in production
    ALLOWED_EXTENSIONS: Set[str] = {
        '.py', '.pyx', '.pyi', '.pyw',  # Python files
        '.txt', '.md', '.rst',  # Documentation
        '.json', '.yaml', '.yml', '.toml', '.cfg', '.ini',  # Config files
        '.gitignore', '.gitattributes',  # Git files
        '.dockerfile',  # Docker files
        '.sql',  # Database files
        '.env.example',  # Environment example files
    }
    
    # Dangerous extensions that should never be allowed
    DANGEROUS_EXTENSIONS: Set[str] = {
        '.exe', '.dll', '.so', '.dylib', '.bin', '.bat', '.cmd', '.ps1', '.sh',
        '.scr', '.com', '.pif', '.jar', '.war', '.ear', '.class', '.dex',
        '.apk', '.ipa', '.dmg', '.pkg', '.msi', '.rpm', '.deb',
        '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
        '.js', '.ts', '.jsx', '.tsx', '.html', '.htm',
        '.php', '.asp', '.aspx', '.jsp', '.cgi',
        '.vbs', '.wsf', '.hta', '.reg',
    }
    
    # Content security patterns
    MALICIOUS_CONTENT_PATTERNS: List[bytes] = [
        rb'<script',  # JavaScript
        rb'eval\s*\(',  # Code evaluation
        rb'exec\s*\(',  # Code execution
        rb'__import__\s*\(',  # Dynamic imports
        rb'subprocess\.',  # System commands
        rb'os\.system',  # System commands
        rb'shell=True',  # Shell execution
        rb'import\s+os',  # OS imports (suspicious in uploads)
        rb'from\s+os\s+import',  # OS imports
        rb'pickle\.loads',  # Pickle deserialization
        rb'marshal\.loads',  # Marshal deserialization
    ]
    
    # Suspicious filename patterns
    SUSPICIOUS_PATTERNS: List[str] = [
        r'\.\./',  # Directory traversal
        r'[<>:"|?*]',  # Invalid filename characters
        r'^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)',  # Windows reserved names
        r'^\.',  # Hidden files (except specific allowed ones)
        r'__pycache__',  # Python cache directories
        r'\.pyc$',  # Python bytecode
        r'node_modules',  # Node.js dependencies
        r'\.git/',  # Git directories
        r'\.svn/',  # SVN directories
        r'\.hg/',  # Mercurial directories
        r'\.DS_Store',  # macOS metadata
        r'Thumbs\.db',  # Windows metadata
    ]
    
    # Security headers for HTTP responses
    SECURITY_HEADERS: Dict[str, str] = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    }
    
    # Logging and monitoring
    LOG_SECURITY_EVENTS = True
    LOG_FILE_UPLOADS = True
    LOG_FAILED_VALIDATIONS = True
    
    # Virus scanning (placeholder for future implementation)
    ENABLE_VIRUS_SCANNING = PRODUCTION_MODE
    VIRUS_SCAN_TIMEOUT = 30  # seconds
    
    # Content analysis limits
    MAX_CONTENT_ANALYSIS_SIZE = 10 * 1024 * 1024  # 10MB
    CONTENT_ANALYSIS_TIMEOUT = 10  # seconds
    
    @classmethod
    def get_upload_limits(cls) -> Dict[str, int]:
        """Get current upload limits"""
        return {
            "max_file_size": cls.MAX_FILE_SIZE,
            "max_total_size": cls.MAX_TOTAL_SIZE,
            "max_files_count": cls.MAX_FILES_COUNT,
            "max_filename_length": cls.MAX_FILENAME_LENGTH,
        }
    
    @classmethod
    def is_extension_allowed(cls, extension: str) -> bool:
        """Check if file extension is allowed"""
        return extension.lower() in cls.ALLOWED_EXTENSIONS
    
    @classmethod
    def is_extension_dangerous(cls, extension: str) -> bool:
        """Check if file extension is dangerous"""
        return extension.lower() in cls.DANGEROUS_EXTENSIONS
    
    @classmethod
    def get_security_headers(cls) -> Dict[str, str]:
        """Get security headers for HTTP responses"""
        return cls.SECURITY_HEADERS.copy()

# Security event logging
class SecurityLogger:
    """Security event logger"""
    
    @staticmethod
    def log_upload_attempt(user_id: str, file_count: int, total_size: int):
        """Log file upload attempt"""
        if SecurityConfig.LOG_FILE_UPLOADS:
            print(f"🔒 SECURITY: Upload attempt - User: {user_id}, Files: {file_count}, Size: {total_size}")
    
    @staticmethod
    def log_validation_failure(user_id: str, filename: str, reason: str):
        """Log validation failure"""
        if SecurityConfig.LOG_FAILED_VALIDATIONS:
            print(f"🚨 SECURITY: Validation failed - User: {user_id}, File: {filename}, Reason: {reason}")
    
    @staticmethod
    def log_suspicious_activity(user_id: str, activity: str, details: str):
        """Log suspicious activity"""
        print(f"⚠️ SECURITY: Suspicious activity - User: {user_id}, Activity: {activity}, Details: {details}")
    
    @staticmethod
    def log_rate_limit_exceeded(user_id: str, endpoint: str):
        """Log rate limit exceeded"""
        print(f"🛑 SECURITY: Rate limit exceeded - User: {user_id}, Endpoint: {endpoint}")

# Security utilities
def sanitize_user_input(input_str: str, max_length: int = 1000) -> str:
    """Sanitize user input for logging and storage"""
    if not input_str:
        return ""
    
    # Truncate if too long
    if len(input_str) > max_length:
        input_str = input_str[:max_length] + "..."
    
    # Remove control characters except newlines and tabs
    sanitized = ''.join(char for char in input_str if ord(char) >= 32 or char in '\n\t')
    
    return sanitized

def generate_security_report() -> Dict[str, any]:
    """Generate security configuration report"""
    return {
        "production_mode": PRODUCTION_MODE,
        "upload_limits": SecurityConfig.get_upload_limits(),
        "allowed_extensions": list(SecurityConfig.ALLOWED_EXTENSIONS),
        "dangerous_extensions_count": len(SecurityConfig.DANGEROUS_EXTENSIONS),
        "security_patterns_count": len(SecurityConfig.SUSPICIOUS_PATTERNS),
        "virus_scanning_enabled": SecurityConfig.ENABLE_VIRUS_SCANNING,
        "logging_enabled": {
            "security_events": SecurityConfig.LOG_SECURITY_EVENTS,
            "file_uploads": SecurityConfig.LOG_FILE_UPLOADS,
            "failed_validations": SecurityConfig.LOG_FAILED_VALIDATIONS,
        }
    }

# Export main configuration
__all__ = ['SecurityConfig', 'SecurityLogger', 'sanitize_user_input', 'generate_security_report']
