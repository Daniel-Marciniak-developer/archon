import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, FileCheck } from 'lucide-react';
import { RepoHeader } from './RepoHeader';
import FileTree from './FileTree';
import CodeViewer from './CodeViewer';
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
        contentError: error instanceof Error ? error.message : 'File loading error',
      }));
    }
  }, [onFetchFileContent]);


  const handleAnalyzeRequest = useCallback(() => {
    onAnalyzeRequest();
  }, [onAnalyzeRequest]);


  const handleBranchChange = useCallback((newBranch: string) => {

    setState({
      selectedFile: null,
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

  useEffect(() => {
    if (!state.selectedFile && fileTree.length > 0) {
      const findReadme = (nodes: FileNode[]): FileNode | null => {
        for (const node of nodes) {
          if (node.type === 'file' && /^readme\.(md|txt)$/i.test(node.name)) {
            return node;
          }
          if (node.type === 'folder' && node.children) {
            const readme = findReadme(node.children);
            if (readme) return readme;
          }
        }
        return null;
      };

      const readme = findReadme(fileTree);
      if (readme) {
        handleFileSelect(readme);
      }
    }
  }, [fileTree, state.selectedFile]);

  return (
    <div className="min-h-screen bg-crystal-void">
      <div className="border-b border-crystal-electric/20">
        <div className="max-w-full px-4">
          <RepoHeader
            repository={repository}
            onBranchChange={handleBranchChange}
          />
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        
        
        <div className="w-80 bg-crystal-void/50 border-r border-crystal-electric/20">
          <div className="h-full p-6">
            <FileTree
              fileTree={fileTree}
              selectedFile={state.selectedFile}
              onFileSelect={handleFileSelect}
            />
          </div>
        </div>

        
        <div className="flex-1 bg-crystal-void/30 border-r border-crystal-electric/20">
          <div className="h-full flex flex-col">
            
            {state.selectedFile && (
              <div className="border-b border-crystal-electric/20 bg-crystal-void/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-crystal-electric rounded-full"></div>
                      <div className="w-2 h-2 bg-crystal-electric/60 rounded-full"></div>
                      <div className="w-2 h-2 bg-crystal-electric/30 rounded-full"></div>
                    </div>
                    <span className="text-crystal-text font-medium">{repository.name}</span>
                    <span className="text-crystal-text/50">/</span>
                    <span className="text-crystal-electric font-bold">{state.selectedFile.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="px-3 py-1 bg-crystal-electric/20 text-crystal-electric text-xs font-bold rounded-lg border border-crystal-electric/30">
                      {state.selectedFile.path.split('.').pop()?.toUpperCase() || 'FILE'}
                    </div>
                    <div className="px-3 py-1 bg-crystal-electric/10 text-crystal-text text-xs font-bold rounded-lg border border-crystal-electric/20">
                      {repository.currentBranch}
                    </div>
                  </div>
                </div>
              </div>
            )}

            
            <div className="flex-1">
              <CodeViewer
                selectedFile={state.selectedFile}
                isContentLoading={state.isContentLoading}
                contentError={state.contentError}
                fileContent={state.fileContent}
              />
            </div>
          </div>
        </div>

        
        <div className="w-80 bg-crystal-void/50">
          <div className="h-full p-6 space-y-6">
            
            <div>
              <h3 className="text-lg font-bold text-crystal-electric mb-3 flex items-center">
                <FileCheck className="w-5 h-5 mr-2" />
                Analysis
              </h3>
              <p className="text-crystal-text/70 text-sm leading-relaxed">
                Analyze code quality, security vulnerabilities, and structure patterns with 
                <span className="text-crystal-electric font-semibold"> AI-powered insights</span>.
              </p>
            </div>

            
            <div className="space-y-4 p-4 bg-crystal-void/30 rounded-xl border border-crystal-electric/20">
              <div className="flex justify-between items-center">
                <span className="text-crystal-text/60 text-sm">Branch:</span>
                <div className="px-2 py-1 bg-crystal-electric/20 text-crystal-electric text-xs font-bold rounded border border-crystal-electric/30">
                  {repository.currentBranch}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-crystal-text/60 text-sm">Branches:</span>
                <span className="text-crystal-text font-bold">{repository.availableBranches.length}</span>
              </div>
              {state.selectedFile && (
                <div className="pt-2 border-t border-crystal-electric/20">
                  <div className="flex justify-between items-center">
                    <span className="text-crystal-text/60 text-sm">File:</span>
                    <span className="text-crystal-electric font-semibold text-xs truncate max-w-32" title={state.selectedFile.name}>
                      {state.selectedFile.name}
                    </span>
                  </div>
                </div>
              )}
            </div>

            
            <Button
              onClick={handleAnalyzeRequest}
              className="w-full crystal-button-violet"
            >
              <div className="flex items-center justify-center space-x-2">
                <Play className="w-5 h-5" />
                <span>Analyze Project</span>
              </div>
            </Button>

            {/* Analysis Status */}
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-3 px-4 py-3 bg-crystal-electric/10 text-crystal-electric rounded-xl border border-crystal-electric/20">
                <div className="w-3 h-3 bg-crystal-electric rounded-full animate-pulse"></div>
                <span className="text-sm font-bold">Ready to Analyze</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepositoryViewer;

