/**
 * Tests for AddProjectModal component
 * Tests dual mode support (GitHub + Upload), tab switching, and project creation
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AddProjectModal } from '../components/AddProjectModal';

// Mock dependencies
vi.mock('brain', () => ({
  default: {
    get_github_repositories: vi.fn(),
    create_project: vi.fn(),
    validate_github_repo: vi.fn(),
    upload_project_files: vi.fn()
  }
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}));

// Mock FileUploadZone component
vi.mock('../components/FileUploadZone', () => ({
  FileUploadZone: ({ onUploadComplete, onUploadError }: any) => (
    <div data-testid="file-upload-zone">
      <button onClick={() => onUploadComplete({ id: 123, name: 'test-project' })}>
        Mock Upload Success
      </button>
      <button onClick={() => onUploadError('Upload failed')}>
        Mock Upload Error
      </button>
    </div>
  )
}));

describe('AddProjectModal', () => {
  const mockProps = {
    open: true,
    onOpenChange: vi.fn(),
    onProjectAdded: vi.fn(),
    existingProjects: []
  };

  const mockGitHubRepos = [
    {
      id: 1,
      name: 'python-project',
      full_name: 'user/python-project',
      owner: { login: 'user' },
      html_url: 'https://github.com/user/python-project',
      description: 'A Python project',
      private: false,
      language: 'Python',
      stargazers_count: 42,
      updated_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      name: 'js-project',
      full_name: 'user/js-project',
      owner: { login: 'user' },
      html_url: 'https://github.com/user/js-project',
      description: 'A JavaScript project',
      private: false,
      language: 'JavaScript',
      stargazers_count: 15,
      updated_at: '2024-01-10T14:20:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with tabs correctly', () => {
    render(<AddProjectModal {...mockProps} />);
    
    expect(screen.getByText('Add New Project')).toBeInTheDocument();
    expect(screen.getByText('GitHub Repository')).toBeInTheDocument();
    expect(screen.getByText('Upload Files')).toBeInTheDocument();
  });

  it('shows GitHub tab by default', () => {
    render(<AddProjectModal {...mockProps} />);
    
    // GitHub tab should be active by default
    const githubTab = screen.getByRole('tab', { name: /github repository/i });
    expect(githubTab).toHaveAttribute('data-state', 'active');
  });

  it('switches between tabs correctly', async () => {
    const user = userEvent.setup();
    render(<AddProjectModal {...mockProps} />);
    
    // Click on Upload Files tab
    const uploadTab = screen.getByRole('tab', { name: /upload files/i });
    await user.click(uploadTab);
    
    expect(uploadTab).toHaveAttribute('data-state', 'active');
    expect(screen.getByTestId('file-upload-zone')).toBeInTheDocument();
  });

  it('loads GitHub repositories on mount', async () => {
    const brain = await import('brain');
    vi.mocked(brain.default.get_github_repositories).mockResolvedValue({
      repositories: mockGitHubRepos
    });

    render(<AddProjectModal {...mockProps} />);
    
    await waitFor(() => {
      expect(brain.default.get_github_repositories).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(screen.getByText('python-project')).toBeInTheDocument();
      expect(screen.getByText('js-project')).toBeInTheDocument();
    });
  });

  it('handles GitHub repository loading error', async () => {
    const brain = await import('brain');
    vi.mocked(brain.default.get_github_repositories).mockRejectedValue(
      new Error('Failed to load repositories')
    );

    render(<AddProjectModal {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load repositories/i)).toBeInTheDocument();
    });
  });

  it('filters repositories by search term', async () => {
    const user = userEvent.setup();
    const brain = await import('brain');
    vi.mocked(brain.default.get_github_repositories).mockResolvedValue({
      repositories: mockGitHubRepos
    });

    render(<AddProjectModal {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('python-project')).toBeInTheDocument();
      expect(screen.getByText('js-project')).toBeInTheDocument();
    });
    
    // Search for Python projects
    const searchInput = screen.getByPlaceholderText(/search repositories/i);
    await user.type(searchInput, 'python');
    
    await waitFor(() => {
      expect(screen.getByText('python-project')).toBeInTheDocument();
      expect(screen.queryByText('js-project')).not.toBeInTheDocument();
    });
  });

  it('shows language badges correctly', async () => {
    const brain = await import('brain');
    vi.mocked(brain.default.get_github_repositories).mockResolvedValue({
      repositories: mockGitHubRepos
    });

    render(<AddProjectModal {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('✓ Python Project')).toBeInTheDocument();
      expect(screen.getByText('⚠ Non-Python')).toBeInTheDocument();
    });
  });

  it('adds GitHub project successfully', async () => {
    const user = userEvent.setup();
    const brain = await import('brain');
    
    vi.mocked(brain.default.get_github_repositories).mockResolvedValue({
      repositories: mockGitHubRepos
    });
    
    vi.mocked(brain.default.create_project).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 123, name: 'python-project' })
    } as any);

    render(<AddProjectModal {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('python-project')).toBeInTheDocument();
    });
    
    // Click add button for Python project
    const addButtons = screen.getAllByText('Add Project');
    await user.click(addButtons[0]);
    
    await waitFor(() => {
      expect(brain.default.create_project).toHaveBeenCalledWith({
        repo_name: 'python-project',
        repo_owner: 'user',
        repo_url: 'https://github.com/user/python-project'
      });
    });
    
    expect(mockProps.onProjectAdded).toHaveBeenCalled();
    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('validates non-Python repositories before adding', async () => {
    const user = userEvent.setup();
    const brain = await import('brain');
    
    vi.mocked(brain.default.get_github_repositories).mockResolvedValue({
      repositories: mockGitHubRepos
    });
    
    vi.mocked(brain.default.validate_github_repo).mockResolvedValue({
      validation: {
        is_suitable: false,
        confidence_score: 0.2,
        warnings: ['Repository language is JavaScript, not Python'],
        errors: []
      }
    });

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<AddProjectModal {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('js-project')).toBeInTheDocument();
    });
    
    // Click add button for JavaScript project
    const addButtons = screen.getAllByText('Add Project');
    await user.click(addButtons[1]); // Second button is for JS project
    
    await waitFor(() => {
      expect(brain.default.validate_github_repo).toHaveBeenCalled();
      expect(confirmSpy).toHaveBeenCalled();
    });
    
    // Should not proceed with creation since user declined
    expect(brain.default.create_project).not.toHaveBeenCalled();
    
    confirmSpy.mockRestore();
  });

  it('handles duplicate project error', async () => {
    const user = userEvent.setup();
    const brain = await import('brain');
    
    vi.mocked(brain.default.get_github_repositories).mockResolvedValue({
      repositories: mockGitHubRepos
    });
    
    vi.mocked(brain.default.create_project).mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ detail: 'Project already exists' })
    } as any);

    render(<AddProjectModal {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('python-project')).toBeInTheDocument();
    });
    
    const addButtons = screen.getAllByText('Add Project');
    await user.click(addButtons[0]);
    
    await waitFor(() => {
      const toast = await import('sonner');
      expect(toast.toast.error).toHaveBeenCalledWith(
        expect.stringContaining('already been added')
      );
    });
  });

  it('handles file upload success', async () => {
    const user = userEvent.setup();
    render(<AddProjectModal {...mockProps} />);
    
    // Switch to upload tab
    const uploadTab = screen.getByRole('tab', { name: /upload files/i });
    await user.click(uploadTab);
    
    // Trigger successful upload
    const successButton = screen.getByText('Mock Upload Success');
    await user.click(successButton);
    
    expect(mockProps.onProjectAdded).toHaveBeenCalled();
    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('handles file upload error', async () => {
    const user = userEvent.setup();
    render(<AddProjectModal {...mockProps} />);
    
    // Switch to upload tab
    const uploadTab = screen.getByRole('tab', { name: /upload files/i });
    await user.click(uploadTab);
    
    // Trigger upload error
    const errorButton = screen.getByText('Mock Upload Error');
    await user.click(errorButton);
    
    // Should show error state but not close modal
    expect(mockProps.onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('shows loading state while fetching repositories', () => {
    const brain = import('brain');
    // Don't resolve the promise to keep loading state
    vi.mocked(brain.then(m => m.default.get_github_repositories)).mockReturnValue(
      new Promise(() => {}) // Never resolves
    );

    render(<AddProjectModal {...mockProps} />);
    
    expect(screen.getByText('Checking GitHub connection...')).toBeInTheDocument();
  });

  it('shows GitHub not connected state', async () => {
    const brain = await import('brain');
    vi.mocked(brain.default.get_github_repositories).mockRejectedValue(
      new Error('GitHub access token not available')
    );

    render(<AddProjectModal {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Connect Your GitHub Account')).toBeInTheDocument();
      expect(screen.getByText('Connect GitHub Account')).toBeInTheDocument();
    });
  });

  it('closes modal when clicking outside or pressing escape', async () => {
    const user = userEvent.setup();
    render(<AddProjectModal {...mockProps} />);
    
    // Press escape key
    await user.keyboard('{Escape}');
    
    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows correct project count and statistics', async () => {
    const brain = await import('brain');
    vi.mocked(brain.default.get_github_repositories).mockResolvedValue({
      repositories: mockGitHubRepos
    });

    render(<AddProjectModal {...mockProps} />);
    
    await waitFor(() => {
      // Should show repository count and other statistics
      expect(screen.getByText('python-project')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument(); // Star count
    });
  });

  it('handles modal state changes correctly', () => {
    const { rerender } = render(<AddProjectModal {...mockProps} open={false} />);
    
    // Modal should not be visible
    expect(screen.queryByText('Add New Project')).not.toBeInTheDocument();
    
    // Open modal
    rerender(<AddProjectModal {...mockProps} open={true} />);
    
    expect(screen.getByText('Add New Project')).toBeInTheDocument();
  });
});
