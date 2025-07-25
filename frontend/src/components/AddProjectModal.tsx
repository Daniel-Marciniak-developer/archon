import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Search,
  GitBranch,
  Lock,
  Globe,
  Calendar,
  Plus,
  AlertCircle,
  Github,
  Upload,
  FolderOpen
} from 'lucide-react';
import { GitHubRepo, ProjectResponse } from 'types';
import brain from 'brain';
import { toast } from 'sonner';
import { FileUploadZone } from './FileUploadZone';
import { useGitHubConnection } from '@/hooks/useGitHubConnection';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectAdded: (projectId?: number) => void;
  existingProjects: ProjectResponse[];
}

export function AddProjectModal({ open, onOpenChange, onProjectAdded, existingProjects }: Props) {
  const {
    isConnected: githubConnected,
    isLoading: githubLoading,
    error: connectionError,
    username: githubUsername,
    repositories,
    repositoriesLoading,
    connectGitHub,
    refreshRepositories,
  } = useGitHubConnection();

  const [searchTerm, setSearchTerm] = useState('');
  const [addingProjectId, setAddingProjectId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'github' | 'upload'>('github');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setError(null);
      setAddingProjectId(null);
      setSearchTerm('');
    }
  }, [open]);





  const handleAddProject = async (repo: GitHubRepo) => {
    try {
      setAddingProjectId(repo.id);

      try {
        const validationResponse = await brain.validate_github_repo(repo);
        const validation = validationResponse.validation;

        if (!validation.is_suitable) {
          const proceed = window.confirm(
            `This repository may not be suitable for analysis (confidence: ${(validation.confidence_score * 100).toFixed(0)}%). ` +
            `Warnings: ${validation.warnings.join(', ')}. Do you want to proceed anyway?`
          );
          if (!proceed) {
            setAddingProjectId(null);
            return;
          }
        } else if (validation.warnings.length > 0) {
          toast.warning(`Repository validated with warnings: ${validation.warnings.join(', ')}`);
        }
      } catch (validationError) {

      }

      const response = await brain.create_project({
        repo_name: repo.name,
        repo_owner: repo.owner.login,
        repo_url: repo.html_url
      });

      if (response.status === 409) {
        toast.error(`${repo.full_name} has already been added.`);
        onProjectAdded();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to add project' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const newProject = await response.json();

      toast.success(`${repo.full_name} imported successfully!`);
      onProjectAdded(newProject.id);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof Response && err.status === 409) {
        toast.error(`${repo.full_name} has already been added.`);
        onProjectAdded();
      } else {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        toast.error(`Failed to import ${repo.full_name}: ${errorMessage}`);
      }
    } finally {
      setAddingProjectId(null);
    }
  };

  const handleFilesSelected = (files: FileList) => {
    setUploadError(null);
  };

  const handleUploadStart = () => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
  };

  const handleUploadProgress = (progress: number) => {
    setUploadProgress(progress);
  };

  const handleUploadComplete = (projectData: any) => {
    setIsUploading(false);
    setUploadProgress(100);
    toast.success('Project uploaded successfully!');
    onProjectAdded(projectData.id);
    onOpenChange(false);
  };

  const handleUploadError = (error: string) => {
    setIsUploading(false);
    setUploadError(error);
    toast.error(`Upload failed: ${error}`);
  };

  const isProjectAdded = (repo: GitHubRepo) => {
    return existingProjects.some(p => p.repo_name === repo.name && p.repo_owner === repo.owner.login);
  };

  const filteredRepositories = repositories.filter(repo => {
    const matchesSearch = searchTerm === '' ||
      repo.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="crystal-glass border-crystal-border max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold crystal-electric">
            Add New Project
          </DialogTitle>
          <DialogDescription className="text-crystal-text-secondary">
            Import a Python project from GitHub or upload your local project files for analysis.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'github' | 'upload')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 crystal-tabs">
            <TabsTrigger value="github" className="crystal-tab flex items-center space-x-2">
              <Github className="w-4 h-4" />
              <span className="crystal-mobile-text-sm">GitHub Repository</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="crystal-tab flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span className="crystal-mobile-text-sm">Upload Files</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="github" className="space-y-4 mt-4">
            {}
            {githubConnected === false && (
              <Card className="crystal-card crystal-border-electric bg-crystal-electric/5">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <Github className="w-16 h-16 crystal-text-electric mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2 crystal-text-primary">Connect Your GitHub Account</h3>
                      <p className="crystal-text-secondary mb-4">
                        To import and analyze your Python repositories, you need to connect your GitHub account.
                        We only access repository metadata and code for analysis purposes.
                      </p>
                    </div>
                    <Button
                      onClick={connectGitHub}
                      className="crystal-btn-primary"
                    >
                      <Github className="w-4 h-4 mr-2" />
                      Connect GitHub Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          {githubConnected === true && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 crystal-text-secondary" />
                <Input
                  placeholder="Search repositories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 crystal-input"
                />
              </div>

              {error && (
                <Card className="border-crystal-critical bg-crystal-critical/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2 text-crystal-critical">
                      <AlertCircle className="w-5 h-5" />
                      <span>{error}</span>
                    </div>
                    <Button
                      onClick={refreshRepositories}
                      variant="outline"
                      className="mt-4 border-crystal-critical text-crystal-critical hover:bg-crystal-critical/10"
                    >
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              )}

              {repositoriesLoading && (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="crystal-glass border-crystal-border">
                      <CardHeader>
                        <Skeleton className="h-5 w-3/4 bg-crystal-surface" />
                        <Skeleton className="h-4 w-1/2 bg-crystal-surface" />
                      </CardHeader>
                      <CardContent>
                        <div className="flex space-x-2">
                          <Skeleton className="h-6 w-16 bg-crystal-surface" />
                          <Skeleton className="h-6 w-20 bg-crystal-surface" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!repositoriesLoading && !error && (
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {filteredRepositories.length === 0 ? (
                    <Card className="crystal-glass border-crystal-border">
                      <CardContent className="pt-6 text-center">
                        <GitBranch className="w-12 h-12 crystal-electric mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Repositories Found</h3>
                        <p className="text-crystal-text-secondary">
                          {searchTerm
                            ? `No repositories match "${searchTerm}"`
                            : 'We couldn\'t find any repositories in your GitHub account.'}
                        </p>
                        {searchTerm && (
                          <Button 
                            onClick={() => setSearchTerm('')}
                            variant="outline"
                            className="mt-4 border-crystal-border"
                          >
                            Clear Search
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    filteredRepositories.map((repo) => {
                      const isAdded = isProjectAdded(repo);
                      return (
                        <Card key={repo.id} className={`crystal-glass border-crystal-border transition-colors ${!isAdded && 'hover:border-crystal-electric'}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-base font-semibold flex items-center space-x-2">
                                  <span>{repo.full_name}</span>
                                  {repo.private ? (
                                    <Lock className="w-4 h-4 text-crystal-text-secondary" />
                                  ) : (
                                    <Globe className="w-4 h-4 text-crystal-text-secondary" />
                                  )}
                                </CardTitle>
                                {repo.description && (
                                  <p className="text-sm text-crystal-text-secondary mt-1 line-clamp-2">
                                    {repo.description}
                                  </p>
                                )}
                              </div>
                              <Button 
                                onClick={() => handleAddProject(repo)}
                                disabled={addingProjectId === repo.id || isAdded}
                                className="crystal-btn-primary ml-4"
                              >
                                {isAdded 
                                  ? 'Added' 
                                  : addingProjectId === repo.id 
                                  ? 'Adding...'
                                  : (
                                  <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Import
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center space-x-4 text-sm text-crystal-text-secondary">
                              {repo.language && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "border-crystal-border",
                                    (repo.language === 'Python' || repo.language === 'TypeScript' || repo.language === 'JavaScript') && "border-crystal-ok text-crystal-ok"
                                  )}
                                >
                                  {repo.language}
                                </Badge>
                              )}
                              {repo.language === 'Python' && (
                                <Badge variant="outline" className="border-crystal-ok text-crystal-ok bg-crystal-ok/10">
                                  ✓ Python Project
                                </Badge>
                              )}
                              {(repo.language === 'TypeScript' || repo.language === 'JavaScript') && (
                                <Badge variant="outline" className="border-crystal-ok text-crystal-ok bg-crystal-ok/10">
                                  ✓ JS/TS Project
                                </Badge>
                              )}
                              {repo.language && !['Python', 'TypeScript', 'JavaScript'].includes(repo.language) && (
                                <Badge variant="outline" className="border-crystal-info text-crystal-info bg-crystal-info/10">
                                  ℹ {repo.language} Project
                                </Badge>
                              )}
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Updated {new Date(repo.updated_at).toLocaleDateString()}
                                </span>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`border-crystal-border ${
                                  repo.private ? 'text-crystal-text-secondary' : 'text-crystal-ok'
                                }`}
                              >
                                {repo.private ? 'Private' : 'Public'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}

            {githubLoading && (
              <div className="text-center py-8">
                <Skeleton className="h-8 w-48 mx-auto bg-crystal-surface" />
                <p className="text-crystal-text-secondary mt-2">Checking GitHub connection...</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="text-center">
                <FolderOpen className="w-12 h-12 crystal-text-electric mx-auto mb-3" />
                <h3 className="text-lg font-semibold crystal-text-primary mb-2">
                  Upload Your Python Project
                </h3>
                <p className="crystal-text-secondary">
                  Upload your local Python project files for analysis. We support individual files or entire project folders.
                </p>
              </div>

              {uploadError && (
                <Card className="crystal-card crystal-border-critical bg-crystal-critical/5">
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2 crystal-text-critical">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{uploadError}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <FileUploadZone
                onFilesSelected={handleFilesSelected}
                onUploadStart={handleUploadStart}
                onUploadProgress={handleUploadProgress}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                disabled={isUploading}
              />

              {isUploading && (
                <Card className="crystal-card crystal-border-electric bg-crystal-electric/5">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium crystal-text-primary">
                          Uploading project...
                        </span>
                        <span className="text-sm crystal-text-secondary">
                          {Math.round(uploadProgress)}%
                        </span>
                      </div>
                      <div className="crystal-progress h-2">
                        <div
                          className="crystal-progress-bar"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}


