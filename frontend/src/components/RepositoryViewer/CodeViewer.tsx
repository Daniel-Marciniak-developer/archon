import React, { useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileText, Code } from 'lucide-react';
import { CodeViewerProps } from './types';


export const CodeViewer: React.FC<CodeViewerProps> = React.memo(({
  selectedFile,
  isContentLoading,
  contentError,
  fileContent,
}) => {
  const getLanguageFromFileName = useMemo(() => {
    if (!selectedFile) return 'text';
    
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'toml': 'toml',
      'ini': 'ini',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'bash',
      'fish': 'bash',
      'ps1': 'powershell',
      'sql': 'sql',
      'md': 'markdown',
      'dockerfile': 'dockerfile',
      'gitignore': 'gitignore',
      'env': 'bash',
    };
    
    return languageMap[extension || ''] || 'text';
  }, [selectedFile]);


  const LoadingState = () => (
    <div className="space-y-3 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Skeleton className="w-5 h-5 rounded" />
        <Skeleton className="w-32 h-5 rounded" />
      </div>
      {Array.from({ length: 15 }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="h-4 rounded" 
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );


  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <AlertCircle className="w-16 h-16 text-crystal-critical mb-4" />
      <h3 className="text-lg font-semibold text-crystal-text-primary mb-2">
        File Loading Error
      </h3>
      <p className="text-crystal-text-secondary max-w-md">
        {contentError || 'An unexpected error occurred while loading file content.'}
      </p>
    </div>
  );


  const DefaultState = () => (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Code className="w-16 h-16 text-crystal-text-secondary mb-4" />
      <h3 className="text-lg font-semibold text-crystal-text-primary mb-2">
        Select File from Tree
      </h3>
      <p className="text-crystal-text-secondary max-w-md">
        Click on a file in the tree on the left side to display its content with syntax highlighting.
      </p>
    </div>
  );


  const CodeContent = () => {
    if (!fileContent || !selectedFile) return null;

    return (
      <div className="relative">
        {}
        <div className="flex items-center space-x-2 p-4 border-b border-crystal-border bg-crystal-surface/30">
          <FileText className="w-4 h-4 text-crystal-electric" />
          <span className="text-sm font-medium text-crystal-text-primary">
            {selectedFile.name}
          </span>
          <span className="text-xs text-crystal-text-secondary">
            ({getLanguageFromFileName})
          </span>
        </div>

        {}
        <div className="overflow-auto max-h-96">
          <pre className="m-0 p-4 bg-slate-900 text-slate-100 text-sm leading-relaxed font-mono rounded border">
            <code className="block whitespace-pre-wrap break-words">
              {fileContent}
            </code>
          </pre>
        </div>
      </div>
    );
  };


  const renderContent = () => {
    if (contentError) {
      return <ErrorState />;
    }
    
    if (isContentLoading) {
      return <LoadingState />;
    }
    
    if (!selectedFile) {
      return <DefaultState />;
    }
    
    if (fileContent) {
      return <CodeContent />;
    }
    
    return <DefaultState />;
  };

  return (
    <Card className="crystal-glass border-crystal-border h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-crystal-text-primary flex items-center">
          <Code className="w-5 h-5 mr-2 text-crystal-electric" />
          Code Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-full">
        {renderContent()}
      </CardContent>
    </Card>
  );
});

CodeViewer.displayName = 'CodeViewer';

export default CodeViewer;

