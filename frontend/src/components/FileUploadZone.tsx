import React, { useCallback, useState } from 'react';
import { Upload, File, X, AlertCircle, CheckCircle2, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import brain from 'brain';
import { toast } from 'sonner';

interface FileUploadZoneProps {
  onFilesSelected: (files: FileList) => void;
  onUploadStart: () => void;
  onUploadProgress: (progress: number) => void;
  onUploadComplete: (projectData: any) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
  maxSizeBytes?: number;
  acceptedFileTypes?: string[];
}

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export function FileUploadZone({
  onFilesSelected,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  disabled = false,
  maxSizeBytes = 100 * 1024 * 1024, // 100MB default
  acceptedFileTypes = ['.py', '.txt', '.md', '.json', '.yaml', '.yml', '.toml', '.cfg', '.ini']
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateFiles = useCallback((files: FileList): { valid: File[], invalid: { file: File, reason: string }[] } => {
    const valid: File[] = [];
    const invalid: { file: File, reason: string }[] = [];

    Array.from(files).forEach(file => {
      // Check file size
      if (file.size > maxSizeBytes) {
        invalid.push({ file, reason: `File too large (max ${Math.round(maxSizeBytes / 1024 / 1024)}MB)` });
        return;
      }

      // Check file type (for individual files)
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (file.type !== '' && !acceptedFileTypes.includes(extension)) {
        // Allow directories and common Python project files
        if (!file.webkitRelativePath && !['requirements.txt', 'setup.py', 'pyproject.toml', 'Pipfile', 'poetry.lock'].includes(file.name)) {
          invalid.push({ file, reason: 'Unsupported file type' });
          return;
        }
      }

      valid.push(file);
    });

    return { valid, invalid };
  }, [maxSizeBytes, acceptedFileTypes]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files);
    }
  }, [disabled]);

  const handleFileSelection = useCallback((files: FileList) => {
    const { valid, invalid } = validateFiles(files);

    if (invalid.length > 0) {
      const errorMessage = `${invalid.length} file(s) rejected: ${invalid.map(i => i.reason).join(', ')}`;
      onUploadError(errorMessage);
    }

    if (valid.length > 0) {
      const newFiles: UploadedFile[] = valid.map(file => ({
        file,
        status: 'pending',
        progress: 0
      }));

      setUploadedFiles(prev => [...prev, ...newFiles]);
      onFilesSelected(files);
    }
  }, [validateFiles, onFilesSelected, onUploadError]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileSelection(files);
    }
    // Reset input value to allow selecting the same files again
    e.target.value = '';
  }, [handleFileSelection]);

  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const startUpload = useCallback(async () => {
    if (uploadedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    onUploadStart();

    try {
      // Mark all files as uploading
      setUploadedFiles(prev => prev.map(file => ({ ...file, status: 'uploading' as const })));

      // Create FormData for upload
      const formData = new FormData();

      // Add all files to FormData
      uploadedFiles.forEach((uploadedFile) => {
        formData.append('files', uploadedFile.file);
      });

      // Generate project name from first file or timestamp
      const projectName = uploadedFiles[0]?.file.name.split('.')[0] || `project-${Date.now()}`;
      formData.append('project_name', projectName);

      console.log('📤 FileUploadZone: Starting upload to backend...');

      // Simulate progress updates during upload
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + 5, 90);
        setUploadProgress(currentProgress);
        onUploadProgress(currentProgress);
      }, 200);

      try {
        // Call backend upload endpoint
        const response = await brain.upload_project_files(formData);

        clearInterval(progressInterval);
        onUploadProgress(100);

        console.log('✅ FileUploadZone: Upload successful:', response);

        // Mark all files as successful
        setUploadedFiles(prev => prev.map(file => ({
          ...file,
          status: 'success' as const,
          progress: 100
        })));

        // Call success callback with response data
        onUploadComplete({
          id: response.project_id,
          name: response.project_name,
          source: 'upload',
          files: uploadedFiles.map(f => f.file.name),
          validation: response.validation_results
        });

        toast.success(`Project "${response.project_name}" uploaded successfully!`);

      } catch (uploadError) {
        clearInterval(progressInterval);
        throw uploadError;
      }

    } catch (error) {
      console.error('❌ FileUploadZone: Upload failed:', error);

      let errorMessage = 'Upload failed';
      let userFriendlyMessage = '';

      if (error instanceof Response) {
        try {
          const errorData = await error.json();
          errorMessage = errorData.detail || `HTTP ${error.status}: ${error.statusText}`;

          // Provide user-friendly messages for common errors
          if (error.status === 413) {
            userFriendlyMessage = 'Files are too large. Please reduce file size or number of files.';
          } else if (error.status === 400) {
            userFriendlyMessage = errorData.detail || 'Invalid files detected. Please check file types and project structure.';
          } else if (error.status === 401) {
            userFriendlyMessage = 'Authentication required. Please log in again.';
          } else if (error.status === 429) {
            userFriendlyMessage = 'Too many upload attempts. Please wait a moment and try again.';
          } else if (error.status >= 500) {
            userFriendlyMessage = 'Server error occurred. Please try again later.';
          }
        } catch {
          errorMessage = `HTTP ${error.status}: ${error.statusText}`;
          userFriendlyMessage = 'Network error occurred. Please check your connection and try again.';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;

        // Handle specific error types
        if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
          userFriendlyMessage = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('timeout')) {
          userFriendlyMessage = 'Upload timed out. Please try with fewer or smaller files.';
        }
      }

      // Use user-friendly message if available, otherwise use technical message
      const displayMessage = userFriendlyMessage || errorMessage;

      // Mark all files as failed
      setUploadedFiles(prev => prev.map(file => ({
        ...file,
        status: 'error' as const,
        error: displayMessage
      })));

      onUploadError(displayMessage);
      toast.error(`Upload failed: ${displayMessage}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [uploadedFiles, onUploadStart, onUploadProgress, onUploadComplete, onUploadError]);

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-crystal-ok" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-crystal-danger" />;
      case 'uploading':
        return <div className="w-4 h-4 border-2 border-crystal-electric border-t-transparent rounded-full animate-spin" />;
      default:
        return <File className="w-4 h-4 text-crystal-text-secondary" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        className={cn(
          "crystal-upload-zone cursor-pointer",
          isDragOver && "drag-over",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              {isDragOver ? (
                <Folder className="w-16 h-16 text-crystal-electric animate-pulse" />
              ) : (
                <Upload className="w-16 h-16 text-crystal-text-secondary" />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-crystal-text-primary mb-2">
                {isDragOver ? 'Drop your project folder here' : 'Upload Python Project'}
              </h3>
              <p className="text-crystal-text-secondary mb-4">
                Drag and drop your project folder or click to browse files
              </p>
              <p className="text-sm text-crystal-text-secondary">
                Supports: Python files, requirements.txt, setup.py, pyproject.toml, and more
              </p>
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                disabled={disabled}
                onClick={() => document.getElementById('file-upload')?.click()}
                className="crystal-btn-secondary hover:crystal-border-electric"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
            </div>

            <input
              id="file-upload"
              type="file"
              multiple
              webkitdirectory="true"
              className="hidden"
              onChange={handleFileInputChange}
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <Card className="crystal-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4 crystal-mobile-stack">
              <h4 className="font-semibold crystal-text-primary">
                Selected Files ({uploadedFiles.length})
              </h4>
              {!isUploading && (
                <Button
                  onClick={startUpload}
                  disabled={uploadedFiles.length === 0}
                  className="crystal-btn-primary crystal-mobile-full mt-2 md:mt-0"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Project
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {uploadedFiles.map((uploadedFile, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-crystal-surface/30"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getStatusIcon(uploadedFile.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-crystal-text-primary truncate">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-xs text-crystal-text-secondary">
                        {formatFileSize(uploadedFile.file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        uploadedFile.status === 'success' && "crystal-badge-success",
                        uploadedFile.status === 'error' && "crystal-badge-critical",
                        uploadedFile.status === 'uploading' && "crystal-badge-electric"
                      )}
                    >
                      {uploadedFile.status === 'uploading'
                        ? `${uploadedFile.progress}%`
                        : uploadedFile.status}
                    </Badge>

                    {!isUploading && uploadedFile.status !== 'uploading' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0 hover:bg-crystal-danger/10"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
