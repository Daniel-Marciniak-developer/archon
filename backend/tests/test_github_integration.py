"""
Unit tests for GitHub integration functionality.
Tests GitHub API integration, repository fetching, and validation.
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import json
from fastapi.testclient import TestClient
from fastapi import HTTPException

from app.apis.github_auth import get_github_repositories
from app.apis.projects import validate_github_repository

class TestGitHubAPIIntegration:
    """Test GitHub API integration."""
    
    @patch('app.apis.github_auth.requests.get')
    def test_github_repositories_success(self, mock_get, mock_user):
        """Test successful GitHub repository fetching."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.ok = True
        mock_response.json.return_value = [
            {
                "id": 1,
                "name": "test-repo",
                "full_name": "testuser/test-repo",
                "description": "A test repository",
                "private": False,
                "html_url": "https://github.com/testuser/test-repo",
                "language": "Python",
                "stargazers_count": 42,
                "updated_at": "2024-01-15T10:30:00Z",
                "owner": {"login": "testuser"}
            }
        ]
        mock_get.return_value = mock_response
        
        with patch.dict('os.environ', {'GITHUB_ACCESS_TOKEN': 'fake_token'}):
            mock_request = MagicMock()
            
            result = asyncio.run(get_github_repositories(mock_request, mock_user))
            
            assert "repositories" in result
            assert len(result["repositories"]) == 1
            assert result["repositories"][0]["name"] == "test-repo"
            assert result["repositories"][0]["language"] == "Python"
    
    @patch('app.apis.github_auth.requests.get')
    def test_github_repositories_unauthorized(self, mock_get, mock_user):
        """Test GitHub API with unauthorized access."""
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.ok = False
        mock_get.return_value = mock_response
        
        with patch.dict('os.environ', {'GITHUB_ACCESS_TOKEN': 'invalid_token'}):
            mock_request = MagicMock()
            
            with pytest.raises(HTTPException) as exc_info:
                asyncio.run(get_github_repositories(mock_request, mock_user))
            
            assert exc_info.value.status_code == 401
            assert "invalid or expired" in exc_info.value.detail.lower()
    
    @patch('app.apis.github_auth.requests.get')
    def test_github_repositories_rate_limit(self, mock_get, mock_user):
        """Test GitHub API rate limit handling."""
        mock_response = MagicMock()
        mock_response.status_code = 403
        mock_response.ok = False
        mock_get.return_value = mock_response
        
        with patch.dict('os.environ', {'GITHUB_ACCESS_TOKEN': 'valid_token'}):
            mock_request = MagicMock()
            
            with pytest.raises(HTTPException) as exc_info:
                asyncio.run(get_github_repositories(mock_request, mock_user))
            
            assert exc_info.value.status_code == 429
            assert "rate limit" in exc_info.value.detail.lower()
    
    def test_github_repositories_development_mode(self, mock_user):
        """Test GitHub repositories in development mode (mock data)."""
        with patch('app.apis.github_auth.DEVELOPMENT_MODE', True):
            mock_request = MagicMock()
            
            result = asyncio.run(get_github_repositories(mock_request, mock_user))
            
            assert "repositories" in result
            assert len(result["repositories"]) > 0
            python_repos = [r for r in result["repositories"] if r["language"] == "Python"]
            assert len(python_repos) > 0

class TestGitHubRepositoryValidation:
    """Test GitHub repository validation logic."""
    
    def test_validate_python_repository(self):
        """Test validation of a good Python repository."""
        repo_data = {
            "name": "awesome-python-tool",
            "language": "Python",
            "description": "A comprehensive Python data analysis toolkit",
            "stargazers_count": 150,
            "updated_at": "2024-01-15T10:30:00Z",
            "fork": False,
            "private": False
        }
        
        result = validate_github_repository(repo_data)
        
        assert result["is_suitable"]
        assert result["confidence_score"] >= 0.7
        assert len(result["errors"]) == 0
        assert result["analysis"]["language"] == "python"
        assert result["analysis"]["stars"] == 150
    
    def test_validate_non_python_repository(self):
        """Test validation of a non-Python repository."""
        repo_data = {
            "name": "react-frontend",
            "language": "JavaScript",
            "description": "A React frontend application",
            "stargazers_count": 50,
            "updated_at": "2024-01-15T10:30:00Z",
            "fork": False,
            "private": False
        }
        
        result = validate_github_repository(repo_data)
        
        assert result["confidence_score"] < 0.5
        assert any("JavaScript" in warning for warning in result["warnings"])
        assert result["analysis"]["language"] == "javascript"
    
    def test_validate_old_repository(self):
        """Test validation of an old repository."""
        repo_data = {
            "name": "old-python-project",
            "language": "Python",
            "description": "An old Python project",
            "stargazers_count": 5,
            "updated_at": "2020-01-15T10:30:00Z",
            "fork": False,
            "private": False
        }
        
        result = validate_github_repository(repo_data)
        
        assert result["is_suitable"]
        assert any("updated" in warning.lower() for warning in result["warnings"])
    
    def test_validate_forked_repository(self):
        """Test validation of a forked repository."""
        repo_data = {
            "name": "forked-python-tool",
            "language": "Python",
            "description": "A forked Python tool",
            "stargazers_count": 100,
            "updated_at": "2024-01-15T10:30:00Z",
            "fork": True,
            "private": False
        }
        
        result = validate_github_repository(repo_data)
        
        assert result["is_suitable"]
        assert any("fork" in warning.lower() for warning in result["warnings"])
        assert result["analysis"]["is_fork"] is True
    
    def test_validate_private_repository(self):
        """Test validation of a private repository."""
        repo_data = {
            "name": "private-python-tool",
            "language": "Python",
            "description": "A private Python tool",
            "stargazers_count": 0,
            "updated_at": "2024-01-15T10:30:00Z",
            "fork": False,
            "private": True
        }
        
        result = validate_github_repository(repo_data)
        
        assert result["is_suitable"]
        assert any("private" in warning.lower() for warning in result["warnings"])
        assert result["analysis"]["is_private"] is True
    
    def test_validate_repository_no_description(self):
        """Test validation of a repository without description."""
        repo_data = {
            "name": "no-desc-repo",
            "language": "Python",
            "description": "",
            "stargazers_count": 10,
            "updated_at": "2024-01-15T10:30:00Z",
            "fork": False,
            "private": False
        }
        
        result = validate_github_repository(repo_data)
        
        assert result["is_suitable"]
        assert any("no description" in warning.lower() for warning in result["warnings"])
        assert not result["analysis"]["has_description"]
    
    def test_validate_repository_python_keywords(self):
        """Test validation with Python keywords in name/description."""
        repo_data = {
            "name": "django-rest-api",
            "language": "Python",
            "description": "A Django REST API with FastAPI integration",
            "stargazers_count": 75,
            "updated_at": "2024-01-15T10:30:00Z",
            "fork": False,
            "private": False
        }
        
        result = validate_github_repository(repo_data)
        
        assert result["is_suitable"]
        assert result["confidence_score"] > 0.8

class TestGitHubAPIErrorHandling:
    """Test error handling in GitHub API integration."""
    
    @patch('app.apis.github_auth.requests.get')
    def test_github_api_network_error(self, mock_get, mock_user):
        """Test handling of network errors."""
        mock_get.side_effect = Exception("Network error")
        
        with patch.dict('os.environ', {'GITHUB_ACCESS_TOKEN': 'valid_token'}):
            mock_request = MagicMock()
            
            with pytest.raises(HTTPException) as exc_info:
                asyncio.run(get_github_repositories(mock_request, mock_user))
            
            assert exc_info.value.status_code == 500
    
    @patch('app.apis.github_auth.requests.get')
    def test_github_api_invalid_json(self, mock_get, mock_user):
        """Test handling of invalid JSON response."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.ok = True
        mock_response.json.side_effect = json.JSONDecodeError("Invalid JSON", "", 0)
        mock_get.return_value = mock_response
        
        with patch.dict('os.environ', {'GITHUB_ACCESS_TOKEN': 'valid_token'}):
            mock_request = MagicMock()
            
            with pytest.raises(HTTPException) as exc_info:
                asyncio.run(get_github_repositories(mock_request, mock_user))
            
            assert exc_info.value.status_code == 500
    
    def test_github_no_token(self, mock_user):
        """Test GitHub API without access token."""
        with patch.dict('os.environ', {}, clear=True):
            mock_request = MagicMock()
            
            with pytest.raises(HTTPException) as exc_info:
                asyncio.run(get_github_repositories(mock_request, mock_user))
            
            assert exc_info.value.status_code == 401
            assert "token not available" in exc_info.value.detail.lower()

class TestGitHubDataTransformation:
    """Test data transformation from GitHub API to internal format."""
    
    @patch('app.apis.github_auth.requests.get')
    def test_repository_data_transformation(self, mock_get, mock_user):
        """Test that GitHub API data is correctly transformed."""
        github_repo = {
            "id": 123456,
            "name": "test-repository",
            "full_name": "testuser/test-repository",
            "description": "A test repository for validation",
            "private": False,
            "html_url": "https://github.com/testuser/test-repository",
            "language": "Python",
            "stargazers_count": 42,
            "updated_at": "2024-01-15T10:30:00Z",
            "owner": {"login": "testuser"}
        }
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.ok = True
        mock_response.json.return_value = [github_repo]
        mock_get.return_value = mock_response
        
        with patch.dict('os.environ', {'GITHUB_ACCESS_TOKEN': 'fake_token'}):
            mock_request = MagicMock()
            result = asyncio.run(get_github_repositories(mock_request, mock_user))
            
            repo = result["repositories"][0]
            
            assert repo["id"] == 123456
            assert repo["name"] == "test-repository"
            assert repo["full_name"] == "testuser/test-repository"
            assert repo["description"] == "A test repository for validation"
            assert repo["private"] is False
            assert repo["html_url"] == "https://github.com/testuser/test-repository"
            assert repo["language"] == "Python"
            assert repo["stargazers_count"] == 42
            assert repo["updated_at"] == "2024-01-15T10:30:00Z"
            assert repo["owner"]["login"] == "testuser"

@pytest.mark.integration
class TestGitHubIntegrationEndpoints:
    """Integration tests for GitHub-related endpoints."""
    
    def test_github_repositories_endpoint(self, client: TestClient):
        """Test the GitHub repositories endpoint."""
        pass
    
    def test_validate_github_repo_endpoint(self, client: TestClient):
        """Test the GitHub repository validation endpoint."""
        pass

if __name__ == "__main__":
    pytest.main([__file__])
