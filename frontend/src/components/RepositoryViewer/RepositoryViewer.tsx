import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, FileCheck } from 'lucide-react';
import { RepoHeader } from './RepoHeader';
import { FileTree } from './FileTree';
import { CodeViewer } from './CodeViewer';
import { RepositoryViewerProps, FileNode, RepositoryViewerState } from './types';


export const RepositoryViewer: React.FC<RepositoryViewerProps> = ({
  repository,
  fileTree,
  onFetchFileContent,
  onBranchChange,
  onAnalyzeRequest,
}) => {

  const [state, setState] = useState<RepositoryViewerState>({
    selectedFile: null,
    filesForAnalysis: [],
    isContentLoading: false,
    contentError: null,
    fileContent: null,
  });


  const handleFileSelect = useCallback(async (file: FileNode) => {
    if (file.type !== 'file') return;

    setState(prev => ({
      ...prev,
      selectedFile: file,
      isContentLoading: true,
      contentError: null,
      fileContent: null,
    }));

    try {
      const content = await onFetchFileContent(file.path);
      setState(prev => ({
        ...prev,
        isContentLoading: false,
        fileContent: content,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isContentLoading: false,
        contentError: error instanceof Error ? error.message : 'Błąd ładowania pliku',
      }));
    }
  }, [onFetchFileContent]);


  const handleFilesForAnalysisChange = useCallback((filePaths: string[]) => {
    setState(prev => ({
      ...prev,
      filesForAnalysis: filePaths,
    }));
  }, []);


  const handleAnalyzeRequest = useCallback(() => {
    onAnalyzeRequest(state.filesForAnalysis);
  }, [onAnalyzeRequest, state.filesForAnalysis]);


  const handleBranchChange = useCallback((newBranch: string) => {

    setState({
      selectedFile: null,
      filesForAnalysis: [],
      isContentLoading: false,
      contentError: null,
      fileContent: null,
    });
    
    onBranchChange(newBranch);
  }, [onBranchChange]);


  useEffect(() => {
    setState(prev => ({
      ...prev,
      selectedFile: null,
      fileContent: null,
      contentError: null,
      isContentLoading: false,
    }));
  }, [fileTree]);

  return (
    <div className="min-h-screen bg-crystal-void p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {}
        <RepoHeader
          repository={repository}
          onBranchChange={handleBranchChange}
        />

        {}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {}
          <div className="lg:col-span-3">
            <FileTree
              fileTree={fileTree}
              selectedFile={state.selectedFile}
              filesForAnalysis={state.filesForAnalysis}
              onFileSelect={handleFileSelect}
              onFilesForAnalysisChange={handleFilesForAnalysisChange}
            />
          </div>

          {}
          <div className="lg:col-span-6">
            <CodeViewer
              selectedFile={state.selectedFile}
              isContentLoading={state.isContentLoading}
              contentError={state.contentError}
              fileContent={state.fileContent}
            />
          </div>

          {}
          <div className="lg:col-span-3">
            <Card className="crystal-glass border-crystal-border h-full">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {}
                  <div>
                    <h3 className="text-lg font-semibold text-crystal-text-primary mb-4 flex items-center">
                      <FileCheck className="w-5 h-5 mr-2 text-crystal-electric" />
                      Pliki do Analizy
                    </h3>
                    
                    {state.filesForAnalysis.length === 0 ? (
                      <p className="text-crystal-text-secondary text-sm">
                        Zaznacz pliki w drzewie po lewej stronie, aby dodać je do analizy.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-crystal-text-secondary text-sm">
                          Wybrano {state.filesForAnalysis.length} {
                            state.filesForAnalysis.length === 1 ? 'plik' : 
                            state.filesForAnalysis.length < 5 ? 'pliki' : 'plików'
                          }:
                        </p>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {state.filesForAnalysis.map((filePath) => (
                            <div
                              key={filePath}
                              className="text-xs text-crystal-text-primary bg-crystal-surface/30 px-2 py-1 rounded truncate"
                              title={filePath}
                            >
                              {filePath.split('/').pop()}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {}
                  <div className="pt-4 border-t border-crystal-border">
                    <Button
                      onClick={handleAnalyzeRequest}
                      disabled={state.filesForAnalysis.length === 0}
                      className="w-full crystal-btn-primary"
                      size="lg"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Przeanalizuj Projekt
                      {state.filesForAnalysis.length > 0 && (
                        <span className="ml-2 bg-crystal-surface/50 px-2 py-0.5 rounded text-xs">
                          {state.filesForAnalysis.length}
                        </span>
                      )}
                    </Button>
                  </div>

                  {}
                  <div className="pt-4 border-t border-crystal-border">
                    <div className="space-y-2 text-xs text-crystal-text-secondary">
                      <p>
                        <strong>Gałąź:</strong> {repository.currentBranch}
                      </p>
                      <p>
                        <strong>Dostępne gałęzie:</strong> {repository.availableBranches.length}
                      </p>
                      {state.selectedFile && (
                        <p>
                          <strong>Wybrany plik:</strong> {state.selectedFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {}

      </div>
    </div>
  );
};

export default RepositoryViewer;

