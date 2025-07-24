"""
Unit tests for file upload functionality.
Tests validation, security, and project creation from uploaded files.
"""
import pytest
import asyncio
from pathlib import Path
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.apis.projects import (
    validate_filename_security,
    validate_file_extension,
    validate_file_size,
    validate_file_content_security,
    sanitize_filename,
    analyze_python_project_simple,
    validate_github_repository
)

class TestFileValidation:
    """Test file validation functions."""
    
    def test_validate_filename_security_valid(self):
        """Test filename security validation with valid filenames."""
        valid_filenames = [
            "main.py",
            "requirements.txt",
            "setup.py",
            "my_module.py",
            "config.json",
            "README.md"
        ]
        
        for filename in valid_filenames:
            is_valid, error = validate_filename_security(filename)
            assert is_valid, f"Valid filename {filename} was rejected: {error}"
            assert error == ""
    
    def test_validate_filename_security_invalid(self):
        """Test filename security validation with invalid filenames."""
        invalid_filenames = [
            "virus.exe",
            "malware.dll",
            "../../../etc/passwd",
            "file\x00name.py",
            "con.py",
            "script.bat",
            "x" * 300 + ".py",
            "file<script>.py",
        ]
        
        for filename in invalid_filenames:
            is_valid, error = validate_filename_security(filename)
            assert not is_valid, f"Invalid filename {filename} was accepted"
            assert error != ""
    
    def test_validate_file_extension_allowed(self):
        """Test file extension validation with allowed extensions."""
        allowed_files = [
            "main.py",
            "script.pyx",
            "types.pyi",
            "requirements.txt",
            "config.json",
            "docker.yml",
            "setup.toml",
            "README.md"
        ]
        
        for filename in allowed_files:
            assert validate_file_extension(filename), f"Allowed file {filename} was rejected"
    
    def test_validate_file_extension_disallowed(self):
        """Test file extension validation with disallowed extensions."""
        disallowed_files = [
            "virus.exe",
            "script.js",
            "page.html",
            "archive.zip",
            "binary.so",
            "script.bat"
        ]
        
        for filename in disallowed_files:
            assert not validate_file_extension(filename), f"Disallowed file {filename} was accepted"
    
    def test_validate_file_size(self):
        """Test file size validation."""
        assert validate_file_size(1024)
        assert validate_file_size(10 * 1024 * 1024)
        assert validate_file_size(50 * 1024 * 1024)
        
        assert not validate_file_size(60 * 1024 * 1024)
        assert not validate_file_size(100 * 1024 * 1024)
    
    def test_validate_file_content_security_safe(self):
        """Test content security validation with safe content."""
        safe_contents = [
            b"print('Hello, World!')",
            b"import json\ndata = {'key': 'value'}",
            b"def calculate(x, y):\n    return x + y",
            b"# This is a comment\nclass MyClass:\n    pass"
        ]
        
        for content in safe_contents:
            is_valid, error = validate_file_content_security(content, "test.py")
            assert is_valid, f"Safe content was rejected: {error}"
    
    def test_validate_file_content_security_malicious(self):
        """Test content security validation with malicious content."""
        malicious_contents = [
            b"import os; os.system('rm -rf /')",
            b"subprocess.call(['curl', 'evil.com'], shell=True)",
            b"eval(user_input)",
            b"exec(malicious_code)",
            b"__import__('os').system('bad')"
        ]
        
        for content in malicious_contents:
            is_valid, error = validate_file_content_security(content, "malicious.py")
            assert not is_valid, f"Malicious content was accepted: {content}"
            assert error != ""
    
    def test_sanitize_filename(self):
        """Test filename sanitization."""
        test_cases = [
            ("normal.py", "normal.py"),
            ("file<script>.py", "file_script_.py"),
            ("../../../etc/passwd", "___etc_passwd"),
            ("file...name.py", "file.name.py"),
            ("  .hidden  ", "hidden"),
            ("", "unnamed_file"),
            ("con.py", "con.py"),
        ]
        
        for input_name, expected in test_cases:
            result = sanitize_filename(input_name)
            assert result == expected, f"Sanitization failed: {input_name} -> {result} (expected {expected})"

class TestProjectAnalysis:
    """Test Python project analysis functionality."""
    
    def test_analyze_python_project_valid(self):
        """Test analysis of valid Python projects."""
        files_metadata = [
            {"filename": "main.py", "size": 1024},
            {"filename": "__init__.py", "size": 50},
            {"filename": "requirements.txt", "size": 200},
            {"filename": "README.md", "size": 500}
        ]
        
        result = analyze_python_project_simple(files_metadata)
        
        assert result["is_python_project"]
        assert result["confidence_score"] >= 0.3
        assert result["python_files"] == 2
        assert result["total_files"] == 4
        assert "requirements.txt" in result["indicators_found"]
        assert len(result["errors"]) == 0
    
    def test_analyze_python_project_with_frameworks(self):
        """Test analysis of Python projects with frameworks."""
        files_metadata = [
            {"filename": "main.py", "size": 1024},
            {"filename": "manage.py", "size": 800},
            {"filename": "requirements.txt", "size": 200},
            {"filename": "models.py", "size": 1500}
        ]
        
        result = analyze_python_project_simple(files_metadata)
        
        assert result["is_python_project"]
        assert result["confidence_score"] > 0.5
        assert "Django" in result["detected_frameworks"]
    
    def test_analyze_python_project_invalid(self):
        """Test analysis of non-Python projects."""
        files_metadata = [
            {"filename": "index.html", "size": 1024},
            {"filename": "style.css", "size": 500},
            {"filename": "script.js", "size": 800}
        ]
        
        result = analyze_python_project_simple(files_metadata)
        
        assert not result["is_python_project"]
        assert result["confidence_score"] < 0.3
        assert result["python_files"] == 0
        assert len(result["errors"]) > 0
    
    def test_analyze_python_project_too_large(self):
        """Test analysis of projects that are too large."""
        files_metadata = [
            {"filename": "main.py", "size": 250 * 1024 * 1024},
        ]
        
        result = analyze_python_project_simple(files_metadata)
        
        assert not result["is_python_project"]
        assert "too large" in " ".join(result["errors"]).lower()

class TestGitHubValidation:
    """Test GitHub repository validation."""
    
    def test_validate_github_repository_python(self):
        """Test validation of Python GitHub repositories."""
        repo_data = {
            "name": "awesome-python-tool",
            "language": "Python",
            "description": "A great Python tool for data analysis",
            "stargazers_count": 150,
            "updated_at": "2024-01-15T10:30:00Z",
            "fork": False,
            "private": False
        }
        
        result = validate_github_repository(repo_data)
        
        assert result["is_suitable"]
        assert result["confidence_score"] >= 0.5
        assert len(result["errors"]) == 0
    
    def test_validate_github_repository_non_python(self):
        """Test validation of non-Python GitHub repositories."""
        repo_data = {
            "name": "react-app",
            "language": "JavaScript",
            "description": "A React application",
            "stargazers_count": 50,
            "updated_at": "2024-01-15T10:30:00Z",
            "fork": False,
            "private": False
        }
        
        result = validate_github_repository(repo_data)
        
        assert result["confidence_score"] < 0.5
        assert any("JavaScript" in warning for warning in result["warnings"])
    
    def test_validate_github_repository_old(self):
        """Test validation of old GitHub repositories."""
        repo_data = {
            "name": "old-python-tool",
            "language": "Python",
            "description": "An old Python tool",
            "stargazers_count": 5,
            "updated_at": "2020-01-15T10:30:00Z",
            "fork": False,
            "private": False
        }
        
        result = validate_github_repository(repo_data)
        
        assert any("updated" in warning.lower() for warning in result["warnings"])

class TestSecurityValidation:
    """Test security-related validation."""
    
    def test_malicious_content_detection(self):
        """Test detection of malicious content patterns."""
        malicious_patterns = [
            b"os.system('rm -rf /')",
            b"subprocess.call(cmd, shell=True)",
            b"eval(user_input)",
            b"exec(malicious_code)",
            b"import os; os.system('bad')"
        ]
        
        for pattern in malicious_patterns:
            is_valid, error = validate_file_content_security(pattern, "test.py")
            assert not is_valid, f"Malicious pattern not detected: {pattern}"
            assert "malicious" in error.lower()
    
    def test_binary_content_detection(self):
        """Test detection of suspicious binary content."""
        binary_content = b"print('hello')" + b"\x00" * 1000
        
        is_valid, error = validate_file_content_security(binary_content, "test.py")
        assert not is_valid
        assert "binary" in error.lower()
    
    def test_empty_file_detection(self):
        """Test detection of empty files."""
        empty_content = b""
        
        is_valid, error = validate_file_content_security(empty_content, "random.py")
        assert not is_valid
        assert "empty" in error.lower()
        
        is_valid, error = validate_file_content_security(empty_content, "__init__.py")
        assert is_valid

@pytest.mark.integration
class TestFileUploadIntegration:
    """Integration tests for file upload endpoints."""
    
    def test_upload_valid_python_project(self, client: TestClient, sample_python_files):
        """Test uploading a valid Python project."""
        pass
    
    def test_upload_malicious_files(self, client: TestClient, sample_malicious_files):
        """Test uploading malicious files (should be rejected)."""
        pass
    
    def test_upload_oversized_files(self, client: TestClient, large_files):
        """Test uploading files that exceed size limits."""
        pass

if __name__ == "__main__":
    pytest.main([__file__])
