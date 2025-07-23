# Archon Backend Tests

This directory contains comprehensive tests for the Archon backend application, covering file upload functionality, GitHub integration, security measures, and more.

## Test Structure

```
tests/
├── __init__.py                 # Test package initialization
├── conftest.py                 # Test configuration and fixtures
├── test_file_upload.py         # File upload functionality tests
├── test_github_integration.py  # GitHub API integration tests
├── test_security.py           # Security and penetration tests
└── README.md                  # This file
```

## Test Categories

### Unit Tests (`@pytest.mark.unit`)
- Fast, isolated tests
- Test individual functions and classes
- Mock external dependencies
- Should run in under 1 second each

### Integration Tests (`@pytest.mark.integration`)
- Test component interactions
- May require database connections
- Test API endpoints end-to-end
- Slower but more comprehensive

### Security Tests (`@pytest.mark.security`)
- Test security measures and attack prevention
- Input validation and sanitization
- Rate limiting and authentication
- File upload security

### Slow Tests (`@pytest.mark.slow`)
- Tests that may take significant time
- Large file upload tests
- Rate limiting tests
- Performance tests

## Running Tests

### Run All Tests
```bash
pytest
```

### Run Specific Test Categories
```bash
# Unit tests only (fast)
pytest -m unit

# Integration tests
pytest -m integration

# Security tests
pytest -m security

# Exclude slow tests
pytest -m "not slow"
```

### Run Specific Test Files
```bash
# File upload tests
pytest tests/test_file_upload.py

# GitHub integration tests
pytest tests/test_github_integration.py

# Security tests
pytest tests/test_security.py
```

### Run with Coverage
```bash
pytest --cov=app --cov-report=html
```

## Test Configuration

### Environment Variables
Tests use the following environment variables:
- `APP_ENV=test` - Sets test environment
- `DATABASE_URL` - Test database connection
- `SECRET_KEY` - Test secret key
- `GITHUB_ACCESS_TOKEN` - Test GitHub token

### Database Setup
For integration tests that require a database:
1. Create a test database: `createdb archon_test`
2. Run migrations: `python -m app.migrations`
3. Tests will automatically clean up after themselves

### Fixtures
Common test fixtures are defined in `conftest.py`:
- `client` - FastAPI test client
- `async_client` - Async test client
- `mock_user` - Mock authenticated user
- `temp_directory` - Temporary directory for file tests
- `sample_python_files` - Sample Python project files
- `sample_malicious_files` - Malicious files for security testing

## Test Data

### Sample Files
Tests use various sample files:
- **Python files**: `main.py`, `__init__.py`, `setup.py`
- **Config files**: `requirements.txt`, `pyproject.toml`
- **Malicious files**: Files with dangerous extensions or content
- **Large files**: Files exceeding size limits

### Mock Data
- GitHub repositories with various languages and properties
- User authentication data
- Project metadata

## Security Testing

Security tests cover:
- **File Upload Security**: Dangerous file detection, size limits, content validation
- **Input Validation**: SQL injection, XSS, directory traversal prevention
- **Rate Limiting**: Request throttling and abuse prevention
- **Authentication**: Token validation and authorization
- **Headers**: Security headers and HTTPS enforcement

## Best Practices

### Writing Tests
1. Use descriptive test names that explain what is being tested
2. Follow the Arrange-Act-Assert pattern
3. Mock external dependencies (GitHub API, database when possible)
4. Use appropriate test markers
5. Clean up resources in teardown

### Test Data
1. Use fixtures for reusable test data
2. Create minimal test data that covers the test case
3. Don't rely on external services in unit tests
4. Use temporary directories for file operations

### Assertions
1. Test both positive and negative cases
2. Verify error messages and status codes
3. Check side effects (database changes, file creation)
4. Test edge cases and boundary conditions

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
- All tests should be deterministic
- No external dependencies for unit tests
- Proper cleanup to avoid test pollution
- Reasonable execution time

## Troubleshooting

### Common Issues
1. **Database connection errors**: Ensure test database exists and is accessible
2. **File permission errors**: Check temporary directory permissions
3. **Import errors**: Ensure all dependencies are installed
4. **Async test issues**: Use `pytest-asyncio` for async tests

### Debug Mode
Run tests with verbose output and no capture:
```bash
pytest -v -s tests/test_file_upload.py::TestFileValidation::test_validate_filename_security_valid
```

### Test Database Reset
If tests are failing due to database state:
```bash
dropdb archon_test && createdb archon_test
```

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure good test coverage (aim for >90%)
3. Add appropriate test markers
4. Update this README if adding new test categories
5. Run the full test suite before submitting
