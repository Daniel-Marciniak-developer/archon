import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@stackframe/react';
import { RepositoryViewer } from '@/components/RepositoryViewer';
import { FileNode } from '@/components/RepositoryViewer/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import brain from '@/brain';
import { auth } from '@/app/auth';
import useGlobalLoading from '@/hooks/useGlobalLoading';

interface RepositoryData {
  repository: {
    name: string;
    url: string;
    description: string;
    availableBranches: string[];
    currentBranch: string;
  };
  fileTree: FileNode[];
}


export const RepositoryViewerPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const rawUser = useUser();
  const { showAnalysisLoading, hideLoading } = useGlobalLoading();


  const user = useMemo(() => rawUser, [rawUser?.id || null]);



  const [repositoryData, setRepositoryData] = useState<RepositoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [hasInitialized, setHasInitialized] = useState(false);


  const fetchRepositoryData = useCallback(async (branch: string = 'main') => {
    if (!projectId || !user) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await brain.get_project_files(parseInt(projectId), branch);

      if (!response.data) {
        throw new Error('No data in server response');
      }

      const data = response.data;


      const countFiles = (tree: FileNode[]): number => {
        let count = 0;
        for (const item of tree) {
          if (item.type === 'file') {
            count++;
          } else if (item.type === 'folder' && item.children) {
            count += countFiles(item.children);
          }
        }
        return count;
      };

      const fileCount = countFiles(data.fileTree);



      setRepositoryData(data);
      setCurrentBranch(branch);
      setHasInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, user]);


  const handleFetchFileContent = useCallback(async (filePath: string): Promise<string> => {
    if (!projectId || !user) {
      throw new Error('No authorization');
    }

    try {
      const response = await brain.get_file_content(parseInt(projectId), filePath, currentBranch);

      if (!response.data) {
        throw new Error('No data in server response');
      }

      if (!response.data.content) {
        throw new Error('No file content in response');
      }

      return response.data.content;
    } catch (error) {

      throw error;
    }
  }, [projectId, user, currentBranch]);


  const handleBranchChange = useCallback((newBranch: string) => {
    fetchRepositoryData(newBranch);
  }, [fetchRepositoryData]);


  const handleAnalyzeRequest = useCallback(async () => {
    if (!projectId || !user) return;

    try {
      showAnalysisLoading();
      await brain.start_analysis({ projectId: parseInt(projectId) });
      navigate(`/projects/${projectId}/report`);
    } catch (err) {
      hideLoading();
      setError(err instanceof Error ? err.message : 'Analysis start error');
    }
  }, [projectId, user, navigate, showAnalysisLoading, hideLoading]);


  useEffect(() => {
    if (projectId && user && !hasInitialized) {
      fetchRepositoryData();
    }
  }, [projectId, user, fetchRepositoryData]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-crystal-void p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {}
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="crystal-btn-secondary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <Skeleton className="h-8 w-64" />
          </div>

          {}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3">
              <Card className="crystal-glass border-crystal-border h-96">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-32" />
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-6">
              <Card className="crystal-glass border-crystal-border h-96">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-40" />
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-3">
              <Card className="crystal-glass border-crystal-border h-96">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-10 w-full" />
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="min-h-screen bg-crystal-void p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="crystal-btn-secondary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <Card className="crystal-glass border-crystal-border">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-crystal-critical mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-crystal-text-primary mb-2">
                Repository Loading Error
              </h2>
              <p className="text-crystal-text-secondary mb-6">
                {error}
              </p>
              <div className="space-x-4">
                <Button
                  onClick={() => fetchRepositoryData(currentBranch)}
                  className="crystal-btn-primary"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="crystal-btn-secondary"
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }


  if (!repositoryData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-crystal-void">
      {}
      <div className="p-6 border-b border-crystal-border">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="crystal-btn-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {}
      <RepositoryViewer
        repository={repositoryData.repository}
        fileTree={repositoryData.fileTree}
        onFetchFileContent={handleFetchFileContent}
        onBranchChange={handleBranchChange}
        onAnalyzeRequest={handleAnalyzeRequest}
      />
    </div>
  );
};

export default RepositoryViewerPage;

