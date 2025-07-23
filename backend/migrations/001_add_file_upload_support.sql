-- Migration: Add file upload support to projects
-- Date: 2025-07-08
-- Description: Extend projects table and add project_files table for uploaded file support

-- Add new columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_source VARCHAR(50) NOT NULL DEFAULT 'github',
ADD COLUMN IF NOT EXISTS upload_metadata JSONB;

-- Add check constraint for project_source
ALTER TABLE projects 
ADD CONSTRAINT IF NOT EXISTS projects_source_check 
CHECK (project_source IN ('github', 'upload'));

-- Create project_files table for uploaded file metadata
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_hash ON project_files(file_hash);
CREATE INDEX IF NOT EXISTS idx_projects_source ON projects(project_source);

-- Update existing projects to have 'github' as source
UPDATE projects SET project_source = 'github' WHERE project_source IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN projects.project_source IS 'Source of the project: github or upload';
COMMENT ON COLUMN projects.upload_metadata IS 'JSON metadata for uploaded projects including validation results';
COMMENT ON TABLE project_files IS 'Metadata for files in uploaded projects';
COMMENT ON COLUMN project_files.file_hash IS 'SHA-256 hash for file deduplication and integrity';
COMMENT ON COLUMN project_files.upload_order IS 'Order in which files were uploaded for maintaining structure';
