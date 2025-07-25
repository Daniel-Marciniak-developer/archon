import os
from typing import Dict, List, Set
from pathlib import Path
PRODUCTION_MODE = os.getenv("APP_ENV", "development") == "production"
class SecurityConfig:
    MAX_FILE_SIZE = 50 * 1024 * 1024 if PRODUCTION_MODE else 100 * 1024 * 1024
    MAX_TOTAL_SIZE = 200 * 1024 * 1024 if PRODUCTION_MODE else 500 * 1024 * 1024
    MAX_FILES_COUNT = 500 if PRODUCTION_MODE else 1000
    MAX_FILENAME_LENGTH = 255
    MAX_FILEPATH_LENGTH = 1000
    UPLOAD_RATE_LIMIT = "3/minute" if PRODUCTION_MODE else "10/minute"
    API_RATE_LIMIT = "60/minute" if PRODUCTION_MODE else "120/minute"
    GITHUB_RATE_LIMIT = "20/minute"
    ALLOWED_EXTENSIONS: Set[str] = {
        '.py', '.pyx', '.pyi', '.pyw',
        '.txt', '.md', '.rst',
        '.json', '.yaml', '.yml', '.toml', '.cfg', '.ini',
        '.gitignore', '.gitattributes',
        '.dockerfile',
        '.sql',
        '.env.example',
    }
    DANGEROUS_EXTENSIONS: Set[str] = {
        '.exe', '.dll', '.so', '.dylib', '.bin', '.bat', '.cmd', '.ps1', '.sh',
        '.scr', '.com', '.pif', '.jar', '.war', '.ear', '.class', '.dex',
        '.apk', '.ipa', '.dmg', '.pkg', '.msi', '.rpm', '.deb',
        '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
        '.js', '.ts', '.jsx', '.tsx', '.html', '.htm',
        '.php', '.asp', '.aspx', '.jsp', '.cgi',
        '.vbs', '.wsf', '.hta', '.reg',
    }
    MALICIOUS_CONTENT_PATTERNS: List[bytes] = [
        rb'<script',
        rb'eval\s*\(',
        rb'exec\s*\(',
        rb'__import__\s*\(',
        rb'subprocess\.',
        rb'os\.system',
        rb'shell=True',
        rb'import\s+os',
        rb'from\s+os\s+import',
        rb'pickle\.loads',
        rb'marshal\.loads',
    ]
    SUSPICIOUS_PATTERNS: List[str] = [
        r'\.\./',
        r'[<>:"|?*]',
        r'^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)',
        r'^\.',
        r'__pycache__',
        r'\.pyc$',
        r'node_modules',
        r'\.git/',
        r'\.svn/',
        r'\.hg/',
        r'\.DS_Store',
        r'Thumbs\.db',
    ]
    SECURITY_HEADERS: Dict[str, str] = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    }
    LOG_SECURITY_EVENTS = True
    LOG_FILE_UPLOADS = True
    LOG_FAILED_VALIDATIONS = True
    ENABLE_VIRUS_SCANNING = PRODUCTION_MODE
    VIRUS_SCAN_TIMEOUT = 30
    MAX_CONTENT_ANALYSIS_SIZE = 10 * 1024 * 1024
    CONTENT_ANALYSIS_TIMEOUT = 10
    @classmethod
    def get_upload_limits(cls) -> Dict[str, int]:
        return {
            "max_file_size": cls.MAX_FILE_SIZE,
            "max_total_size": cls.MAX_TOTAL_SIZE,
            "max_files_count": cls.MAX_FILES_COUNT,
            "max_filename_length": cls.MAX_FILENAME_LENGTH,
        }
    @classmethod
    def is_extension_allowed(cls, extension: str) -> bool:
        return extension.lower() in cls.ALLOWED_EXTENSIONS
    @classmethod
    def is_extension_dangerous(cls, extension: str) -> bool:
        return extension.lower() in cls.DANGEROUS_EXTENSIONS
    @classmethod
    def get_security_headers(cls) -> Dict[str, str]:
        return cls.SECURITY_HEADERS.copy()
class SecurityLogger:
    @staticmethod
    def log_upload_attempt(user_id: str, file_count: int, total_size: int):
        if SecurityConfig.LOG_FILE_UPLOADS:
            pass
    @staticmethod
    def log_validation_failure(user_id: str, filename: str, reason: str):
        if SecurityConfig.LOG_FAILED_VALIDATIONS:
            pass
    @staticmethod
    def log_suspicious_activity(user_id: str, activity: str, details: str):
        pass
    @staticmethod
    def log_rate_limit_exceeded(user_id: str, endpoint: str):
        pass
def sanitize_user_input(input_str: str, max_length: int = 1000) -> str:
    if not input_str:
        return ""
    if len(input_str) > max_length:
        input_str = input_str[:max_length] + "..."
    sanitized = ''.join(char for char in input_str if ord(char) >= 32 or char in '\n\t')
    return sanitized
def generate_security_report() -> Dict[str, any]:
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
__all__ = ['SecurityConfig', 'SecurityLogger', 'sanitize_user_input', 'generate_security_report']
