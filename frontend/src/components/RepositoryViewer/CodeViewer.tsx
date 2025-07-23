import React, { useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileText, Code } from 'lucide-react';
import { CodeViewerProps } from './types';

/**
 * CodeViewer - Komponent do wyświetlania zawartości plików
 * 
 * Wyświetla sformatowany kod z podświetlaniem składni używając react-syntax-highlighter
 * z motywem atomDark. Obsługuje stany ładowania, błędu i domyślny.
 */
export const CodeViewer: React.FC<CodeViewerProps> = React.memo(({
  selectedFile,
  isContentLoading,
  contentError,
  fileContent,
}) => {
  // Funkcja do określenia języka na podstawie rozszerzenia pliku
  const getLanguageFromFileName = useMemo(() => {
    if (!selectedFile) return 'text';
    
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
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

  // Komponent stanu ładowania
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

  // Komponent stanu błędu
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <AlertCircle className="w-16 h-16 text-crystal-critical mb-4" />
      <h3 className="text-lg font-semibold text-crystal-text-primary mb-2">
        Błąd ładowania pliku
      </h3>
      <p className="text-crystal-text-secondary max-w-md">
        {contentError || 'Wystąpił nieoczekiwany błąd podczas ładowania zawartości pliku.'}
      </p>
    </div>
  );

  // Komponent stanu domyślnego (brak wybranego pliku)
  const DefaultState = () => (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Code className="w-16 h-16 text-crystal-text-secondary mb-4" />
      <h3 className="text-lg font-semibold text-crystal-text-primary mb-2">
        Wybierz plik z drzewa
      </h3>
      <p className="text-crystal-text-secondary max-w-md">
        Kliknij na plik w drzewie po lewej stronie, aby wyświetlić jego zawartość z podświetlaniem składni.
      </p>
    </div>
  );

  // Komponent wyświetlający kod
  const CodeContent = () => {
    if (!fileContent || !selectedFile) return null;

    return (
      <div className="relative">
        {/* Nagłówek z nazwą pliku */}
        <div className="flex items-center space-x-2 p-4 border-b border-crystal-border bg-crystal-surface/30">
          <FileText className="w-4 h-4 text-crystal-electric" />
          <span className="text-sm font-medium text-crystal-text-primary">
            {selectedFile.name}
          </span>
          <span className="text-xs text-crystal-text-secondary">
            ({getLanguageFromFileName})
          </span>
        </div>

        {/* Zawartość kodu */}
        <div className="overflow-auto max-h-96">
          <SyntaxHighlighter
            language={getLanguageFromFileName}
            style={atomDark}
            showLineNumbers={true}
            lineNumberStyle={{
              color: 'hsl(var(--crystal-text-secondary))',
              fontSize: '0.75rem',
              paddingRight: '1rem',
              minWidth: '3rem',
              textAlign: 'right',
            }}
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: 'transparent',
              fontSize: '0.875rem',
              lineHeight: '1.5',
            }}
            codeTagProps={{
              style: {
                fontFamily: '"Fira Code", Consolas, "Courier New", monospace',
                fontSize: '0.875rem',
              }
            }}
          >
            {fileContent}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  };

  // Renderowanie głównego komponentu
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
          Podgląd Kodu
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
