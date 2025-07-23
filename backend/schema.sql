-- Archon Database Schema
-- PostgreSQL database schema for code analysis application

-- Create database (run this manually if needed)
-- CREATE DATABASE archon_dev;
-- CREATE DATABASE archon_prod;

-- Users table - stores GitHub user information
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    github_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    github_access_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table - stores both GitHub repository and uploaded file project information
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repo_name VARCHAR(255) NOT NULL,
    repo_owner VARCHAR(255) NOT NULL,
    repo_url TEXT NOT NULL,
    project_source VARCHAR(50) NOT NULL DEFAULT 'github', -- 'github' or 'upload'
    upload_metadata JSONB, -- For uploaded projects: file count, size, validation results
    last_analysis_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, repo_owner, repo_name),
    CHECK (project_source IN ('github', 'upload'))
);

-- Project files table - stores metadata for uploaded files
CREATE TABLE IF NOT EXISTS project_files (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    file_path TEXT, -- Relative path within project
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(64), -- SHA-256 hash for deduplication
    mime_type VARCHAR(100),
    upload_order INTEGER DEFAULT 0, -- Order in which files were uploaded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analyses table - stores analysis results
CREATE TABLE IF NOT EXISTS analyses (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    overall_score DECIMAL(5,2) DEFAULT 0,
    structure_score DECIMAL(5,2) DEFAULT 0,
    quality_score DECIMAL(5,2) DEFAULT 0,
    security_score DECIMAL(5,2) DEFAULT 0,
    dependencies_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    CHECK (overall_score >= 0 AND overall_score <= 100),
    CHECK (structure_score >= 0 AND structure_score <= 100),
    CHECK (quality_score >= 0 AND quality_score <= 100),
    CHECK (security_score >= 0 AND security_score <= 100),
    CHECK (dependencies_score >= 0 AND dependencies_score <= 100)
);

-- Issues table - stores individual code issues found during analysis
CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    line_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (category IN ('Structure', 'Quality', 'Security', 'Dependencies')),
    CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
    CHECK (line_number > 0)
);

-- Add foreign key constraint for last_analysis_id
ALTER TABLE projects 
ADD CONSTRAINT fk_projects_last_analysis 
FOREIGN KEY (last_analysis_id) REFERENCES analyses(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_repo ON projects(repo_owner, repo_name);
CREATE INDEX IF NOT EXISTS idx_analyses_project_id ON analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_issues_analysis_id ON issues(analysis_id);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development (optional)
-- INSERT INTO users (github_id, username, avatar_url, github_access_token) 
-- VALUES (12345, 'testuser', 'https://github.com/testuser.png', 'ghp_test_token_123');

-- INSERT INTO projects (user_id, repo_name, repo_owner, repo_url) 
-- VALUES (1, 'test-repo', 'testuser', 'https://github.com/testuser/test-repo');

-- INSERT INTO analyses (project_id, status, overall_score, structure_score, quality_score, security_score, dependencies_score)
-- VALUES (1, 'completed', 85.5, 90.0, 80.0, 85.0, 88.0);

COMMENT ON TABLE users IS 'GitHub users who have authenticated with the application';
COMMENT ON TABLE projects IS 'GitHub repositories that users have added for analysis';
COMMENT ON TABLE analyses IS 'Code analysis results for projects';
COMMENT ON TABLE issues IS 'Individual code issues found during analysis';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_file_hash ON project_files(file_hash);
CREATE INDEX IF NOT EXISTS idx_analyses_project_id ON analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_analysis_id ON issues(analysis_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_github_repo_id ON projects(github_repo_id);
