import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@stackframe/react';
import { RepositoryViewer } from '@/components/RepositoryViewer';
import { FileNode } from '@/components/RepositoryViewer/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

/**
 * RepositoryViewerPage - Strona do przeglądania repozytorium
 * 
 * Integruje komponent RepositoryViewer z API backendu i routingiem.
 * Obsługuje pobieranie danych z GitHub API przez backend.
 */
export const RepositoryViewerPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const user = useUser();

  const [repositoryData, setRepositoryData] = useState<RepositoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBranch, setCurrentBranch] = useState('main');

  // Funkcja do pobierania danych repozytorium
  const fetchRepositoryData = useCallback(async (branch: string = 'main') => {
    console.log('🔄 RepositoryViewer: Starting fetchRepositoryData', { projectId, branch, hasUser: !!user });

    if (!projectId || !user) {
      console.log('❌ RepositoryViewer: Missing projectId or user', { projectId, hasUser: !!user });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Pobierz token asynchronicznie
      console.log('🔑 RepositoryViewer: Getting auth token...');
      const authJson = await user.getAuthJson();
      const accessToken = authJson.accessToken;

      if (!accessToken) {
        console.log('❌ RepositoryViewer: No access token available');
        setError('Brak tokenu autoryzacji');
        return;
      }

      console.log('✅ RepositoryViewer: Access token obtained');
      console.log('📡 RepositoryViewer: Sending request to backend', { url: `/routes/projects/${projectId}/files?branch=${encodeURIComponent(branch)}` });

      const response = await fetch(
        `/routes/projects/${projectId}/files?branch=${encodeURIComponent(branch)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('📡 RepositoryViewer: Response received', { status: response.status, ok: response.ok });

      if (!response.ok) {
        console.log('❌ RepositoryViewer: Response not OK', { status: response.status, statusText: response.statusText });
        if (response.status === 404) {
          throw new Error('Projekt nie został znaleziony lub nie masz do niego dostępu');
        } else if (response.status === 403) {
          throw new Error('Brak dostępu do GitHub. Sprawdź połączenie z GitHub.');
        } else {
          throw new Error(`Błąd pobierania danych: ${response.status}`);
        }
      }

      console.log('🔄 RepositoryViewer: Parsing JSON response...');
      const data = await response.json();
      console.log('✅ RepositoryViewer: Data received successfully', { filesCount: data.files?.length || 0, branches: data.branches?.length || 0 });
      setRepositoryData(data);
      setCurrentBranch(branch);
    } catch (err) {
      console.error('❌ RepositoryViewer: Error fetching repository data:', err);
      setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd');
    } finally {
      console.log('🏁 RepositoryViewer: fetchRepositoryData completed');
      setIsLoading(false);
    }
  }, [projectId, user]);

  // Funkcja do pobierania zawartości pliku
  const handleFetchFileContent = useCallback(async (filePath: string): Promise<string> => {
    if (!projectId || !user) {
      throw new Error('Brak autoryzacji');
    }

    // Pobierz token asynchronicznie
    const authJson = await user.getAuthJson();
    const accessToken = authJson.accessToken;

    if (!accessToken) {
      throw new Error('Brak tokenu autoryzacji');
    }

    const response = await fetch(
      `/routes/projects/${projectId}/files/content?file_path=${encodeURIComponent(filePath)}&branch=${encodeURIComponent(currentBranch)}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Plik nie został znaleziony');
      } else {
        throw new Error(`Błąd pobierania pliku: ${response.status}`);
      }
    }

    const data = await response.json();
    return data.content;
  }, [projectId, user, currentBranch]);

  // Funkcja do zmiany gałęzi
  const handleBranchChange = useCallback((newBranch: string) => {
    fetchRepositoryData(newBranch);
  }, [fetchRepositoryData]);

  // Funkcja do rozpoczęcia analizy
  const handleAnalyzeRequest = useCallback(async (selectedFilePaths: string[]) => {
    if (!projectId || !user) return;

    try {
      console.log('Starting analysis for files:', selectedFilePaths);

      // Pobierz token asynchronicznie
      const authJson = await user.getAuthJson();
      const accessToken = authJson.accessToken;

      if (!accessToken) {
        throw new Error('Brak tokenu autoryzacji');
      }

      const response = await fetch(`/routes/projects/${projectId}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Błąd rozpoczęcia analizy: ${response.status}`);
      }

      const result = await response.json();
      console.log('Analysis started:', result);
      
      // Przekieruj do strony z wynikami analizy
      navigate(`/projects/${projectId}/report`);
    } catch (err) {
      console.error('Error starting analysis:', err);
      setError(err instanceof Error ? err.message : 'Błąd rozpoczęcia analizy');
    }
  }, [projectId, user, navigate]);

  // Efekt do pobierania danych przy załadowaniu strony
  useEffect(() => {
    console.log('🚀 RepositoryViewer: useEffect triggered', { projectId, hasUser: !!user });
    fetchRepositoryData();
  }, [fetchRepositoryData]);

  // Komponent ładowania
  if (isLoading) {
    return (
      <div className="min-h-screen bg-crystal-void p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Nagłówek z przyciskiem powrotu */}
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="crystal-btn-secondary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót do Dashboard
            </Button>
            <Skeleton className="h-8 w-64" />
          </div>

          {/* Skeleton dla RepositoryViewer */}
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

  // Komponent błędu
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
              Powrót do Dashboard
            </Button>
          </div>

          <Card className="crystal-glass border-crystal-border">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-crystal-critical mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-crystal-text-primary mb-2">
                Błąd ładowania repozytorium
              </h2>
              <p className="text-crystal-text-secondary mb-6">
                {error}
              </p>
              <div className="space-x-4">
                <Button
                  onClick={() => fetchRepositoryData(currentBranch)}
                  className="crystal-btn-primary"
                >
                  Spróbuj ponownie
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="crystal-btn-secondary"
                >
                  Powrót do Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Główny komponent z RepositoryViewer
  if (!repositoryData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-crystal-void">
      {/* Nagłówek z przyciskiem powrotu */}
      <div className="p-6 border-b border-crystal-border">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="crystal-btn-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrót do Dashboard
          </Button>
        </div>
      </div>

      {/* RepositoryViewer */}
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
