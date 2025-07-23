/**
 * Tests for FileUploadZone component
 * Tests drag & drop functionality, file validation, and upload process
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FileUploadZone } from '../components/FileUploadZone';

// Mock the brain module
vi.mock('brain', () => ({
  default: {
    upload_project_files: vi.fn()
  }
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}));

describe('FileUploadZone', () => {
  const mockProps = {
    onFilesSelected: vi.fn(),
    onUploadStart: vi.fn(),
    onUploadProgress: vi.fn(),
    onUploadComplete: vi.fn(),
    onUploadError: vi.fn(),
    disabled: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload zone correctly', () => {
    render(<FileUploadZone {...mockProps} />);
    
    expect(screen.getByText('Upload Python Project')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop your project folder or click to browse files')).toBeInTheDocument();
    expect(screen.getByText('Choose Files')).toBeInTheDocument();
  });

  it('shows disabled state when disabled prop is true', () => {
    render(<FileUploadZone {...mockProps} disabled={true} />);
    
    const chooseFilesButton = screen.getByText('Choose Files');
    expect(chooseFilesButton).toBeDisabled();
  });

  it('handles file selection correctly', async () => {
    const user = userEvent.setup();
    render(<FileUploadZone {...mockProps} />);

    // Create mock files
    const file1 = new File(['print("hello")'], 'main.py', { type: 'text/plain' });
    const file2 = new File(['# Package'], '__init__.py', { type: 'text/plain' });
    
    const fileInput = screen.getByLabelText(/choose files/i);
    
    await user.upload(fileInput, [file1, file2]);
    
    expect(mockProps.onFilesSelected).toHaveBeenCalledWith(
      expect.objectContaining({
        length: 2
      })
    );
  });

  it('validates file extensions correctly', async () => {
    const user = userEvent.setup();
    render(<FileUploadZone {...mockProps} />);

    // Create files with invalid extensions
    const invalidFile = new File(['malicious content'], 'virus.exe', { type: 'application/octet-stream' });
    
    const fileInput = screen.getByLabelText(/choose files/i);
    
    await user.upload(fileInput, [invalidFile]);
    
    expect(mockProps.onUploadError).toHaveBeenCalledWith(
      expect.stringContaining('Unsupported file type')
    );
  });

  it('validates file sizes correctly', async () => {
    const user = userEvent.setup();
    render(<FileUploadZone {...mockProps} />);

    // Create a large file (simulate by mocking the size property)
    const largeContent = 'x'.repeat(101 * 1024 * 1024); // 101MB
    const largeFile = new File([largeContent], 'large.py', { type: 'text/plain' });
    
    const fileInput = screen.getByLabelText(/choose files/i);
    
    await user.upload(fileInput, [largeFile]);
    
    expect(mockProps.onUploadError).toHaveBeenCalledWith(
      expect.stringContaining('File too large')
    );
  });

  it('handles drag and drop events', () => {
    render(<FileUploadZone {...mockProps} />);
    
    const dropZone = screen.getByText('Upload Python Project').closest('.border-dashed');
    
    // Test drag over
    fireEvent.dragOver(dropZone!, {
      dataTransfer: {
        files: []
      }
    });
    
    expect(dropZone).toHaveClass('border-crystal-electric');
    
    // Test drag leave
    fireEvent.dragLeave(dropZone!);
    
    expect(dropZone).not.toHaveClass('border-crystal-electric');
  });

  it('handles file drop correctly', async () => {
    render(<FileUploadZone {...mockProps} />);
    
    const dropZone = screen.getByText('Upload Python Project').closest('.border-dashed');
    
    const file = new File(['print("hello")'], 'main.py', { type: 'text/plain' });
    
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [file]
      }
    });
    
    await waitFor(() => {
      expect(mockProps.onFilesSelected).toHaveBeenCalled();
    });
  });

  it('displays selected files correctly', async () => {
    const user = userEvent.setup();
    render(<FileUploadZone {...mockProps} />);

    const file = new File(['print("hello")'], 'main.py', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/choose files/i);
    
    await user.upload(fileInput, [file]);
    
    await waitFor(() => {
      expect(screen.getByText('main.py')).toBeInTheDocument();
      expect(screen.getByText('Selected Files (1)')).toBeInTheDocument();
    });
  });

  it('allows removing selected files', async () => {
    const user = userEvent.setup();
    render(<FileUploadZone {...mockProps} />);

    const file = new File(['print("hello")'], 'main.py', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/choose files/i);
    
    await user.upload(fileInput, [file]);
    
    await waitFor(() => {
      expect(screen.getByText('main.py')).toBeInTheDocument();
    });
    
    // Find and click remove button
    const removeButton = screen.getByRole('button', { name: /remove/i });
    await user.click(removeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('main.py')).not.toBeInTheDocument();
    });
  });

  it('starts upload process correctly', async () => {
    const user = userEvent.setup();
    const mockUploadResponse = {
      project_id: 123,
      project_name: 'test-project',
      files_processed: 1,
      total_size_bytes: 1024,
      validation_results: { is_python_project: true }
    };

    // Mock successful upload
    const brain = await import('brain');
    vi.mocked(brain.default.upload_project_files).mockResolvedValue(mockUploadResponse);

    render(<FileUploadZone {...mockProps} />);

    const file = new File(['print("hello")'], 'main.py', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/choose files/i);
    
    await user.upload(fileInput, [file]);
    
    await waitFor(() => {
      expect(screen.getByText('Upload Project')).toBeInTheDocument();
    });
    
    const uploadButton = screen.getByText('Upload Project');
    await user.click(uploadButton);
    
    expect(mockProps.onUploadStart).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(mockProps.onUploadComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 123,
          name: 'test-project'
        })
      );
    });
  });

  it('handles upload errors correctly', async () => {
    const user = userEvent.setup();
    const mockError = new Error('Upload failed');

    // Mock failed upload
    const brain = await import('brain');
    vi.mocked(brain.default.upload_project_files).mockRejectedValue(mockError);

    render(<FileUploadZone {...mockProps} />);

    const file = new File(['print("hello")'], 'main.py', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/choose files/i);
    
    await user.upload(fileInput, [file]);
    
    const uploadButton = screen.getByText('Upload Project');
    await user.click(uploadButton);
    
    await waitFor(() => {
      expect(mockProps.onUploadError).toHaveBeenCalledWith('Upload failed');
    });
  });

  it('shows upload progress correctly', async () => {
    const user = userEvent.setup();
    
    // Mock upload that takes time
    const brain = await import('brain');
    vi.mocked(brain.default.upload_project_files).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        project_id: 123,
        project_name: 'test-project',
        files_processed: 1,
        total_size_bytes: 1024,
        validation_results: { is_python_project: true }
      }), 1000))
    );

    render(<FileUploadZone {...mockProps} />);

    const file = new File(['print("hello")'], 'main.py', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/choose files/i);
    
    await user.upload(fileInput, [file]);
    
    const uploadButton = screen.getByText('Upload Project');
    await user.click(uploadButton);
    
    // Should show uploading state
    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });
  });

  it('formats file sizes correctly', () => {
    render(<FileUploadZone {...mockProps} />);
    
    // This would test the formatFileSize utility function
    // We'd need to expose it or test it indirectly through file display
  });

  it('handles multiple file selection', async () => {
    const user = userEvent.setup();
    render(<FileUploadZone {...mockProps} />);

    const files = [
      new File(['print("hello")'], 'main.py', { type: 'text/plain' }),
      new File(['# Package'], '__init__.py', { type: 'text/plain' }),
      new File(['fastapi==0.104.1'], 'requirements.txt', { type: 'text/plain' })
    ];
    
    const fileInput = screen.getByLabelText(/choose files/i);
    
    await user.upload(fileInput, files);
    
    await waitFor(() => {
      expect(screen.getByText('Selected Files (3)')).toBeInTheDocument();
      expect(screen.getByText('main.py')).toBeInTheDocument();
      expect(screen.getByText('__init__.py')).toBeInTheDocument();
      expect(screen.getByText('requirements.txt')).toBeInTheDocument();
    });
  });

  it('prevents upload when disabled', async () => {
    const user = userEvent.setup();
    render(<FileUploadZone {...mockProps} disabled={true} />);

    const dropZone = screen.getByText('Upload Python Project').closest('.border-dashed');
    
    // Try to drop files when disabled
    const file = new File(['print("hello")'], 'main.py', { type: 'text/plain' });
    
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [file]
      }
    });
    
    // Should not call onFilesSelected when disabled
    expect(mockProps.onFilesSelected).not.toHaveBeenCalled();
  });
});
