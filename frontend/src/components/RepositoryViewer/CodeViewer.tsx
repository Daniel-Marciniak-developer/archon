import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code } from 'lucide-react';
import { CodeViewerProps } from './types';

export const CodeViewer: React.FC<CodeViewerProps> = React.memo(({
  selectedFile,
  isContentLoading,
  contentError,
  fileContent,
}) => {
  const getLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      html: 'html',
      css: 'css',
      scss: 'scss',
      sass: 'sass',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
      md: 'markdown',
      sh: 'bash',
      bat: 'batch',
      sql: 'sql',
      dockerfile: 'dockerfile',
    };

    return languageMap[extension || ''] || 'text';
  };

  const language = selectedFile ? getLanguageFromFileName(selectedFile.name) : 'text';

  // Enhanced syntax highlighting for IDE-like experience
  const syntaxHighlighter = (code: string, lang: string) => {
    // JavaScript/TypeScript syntax patterns
    const jsPatterns = [
      { pattern: /\b(function|const|let|var|class|interface|type|enum|import|export|from|default|async|await|return|if|else|for|while|switch|case|break|continue|try|catch|finally|throw|new|this|super)\b/g, className: 'text-purple-400 font-semibold' },
      { pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, className: 'text-orange-400 font-medium' },
      { pattern: /\b\d+\.?\d*\b/g, className: 'text-green-400' },
      { pattern: /"([^"\\]|\\.)*"/g, className: 'text-emerald-300' },
      { pattern: /'([^'\\]|\\.)*'/g, className: 'text-emerald-300' },
      { pattern: /`([^`\\]|\\.)*`/g, className: 'text-emerald-300' },
      { pattern: /\/\/.*$/gm, className: 'text-gray-500 italic' },
      { pattern: /\/\*[\s\S]*?\*\//g, className: 'text-gray-500 italic' },
      { pattern: /\b[A-Z][a-zA-Z0-9]*\b/g, className: 'text-yellow-300' },
      { pattern: /\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()/g, className: 'text-blue-400 font-medium' },
    ];

    // Python syntax patterns
    const pythonPatterns = [
      { pattern: /\b(def|class|import|from|if|elif|else|for|while|try|except|finally|with|as|return|yield|break|continue|pass|lambda|and|or|not|in|is|None|True|False)\b/g, className: 'text-purple-400 font-semibold' },
      { pattern: /\b\d+\.?\d*\b/g, className: 'text-green-400' },
      { pattern: /"([^"\\]|\\.)*"/g, className: 'text-emerald-300' },
      { pattern: /'([^'\\]|\\.)*'/g, className: 'text-emerald-300' },
      { pattern: /#.*$/gm, className: 'text-gray-500 italic' },
      { pattern: /\b[A-Z][a-zA-Z0-9]*\b/g, className: 'text-yellow-300' },
      { pattern: /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/g, className: 'text-blue-400 font-medium' },
    ];

    let patterns = jsPatterns;
    if (lang === 'python') patterns = pythonPatterns;

    let highlightedCode = code;
    const replacements: Array<{original: string, replacement: string}> = [];

    patterns.forEach((pattern, index) => {
      highlightedCode = highlightedCode.replace(pattern.pattern, (match) => {
        const id = `__HIGHLIGHT_${index}_${Math.random().toString(36).substr(2, 9)}__`;
        replacements.push({
          original: id,
          replacement: `<span class="${pattern.className}">${match}</span>`
        });
        return id;
      });
    });

    // Apply all replacements
    replacements.forEach(({original, replacement}) => {
      highlightedCode = highlightedCode.replace(original, replacement);
    });

    return highlightedCode;
  };

  return (
    <div className="h-full w-full bg-crystal-void/30 border border-crystal-electric/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-crystal-void/50 border-b border-crystal-electric/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <div className="h-6 w-px bg-crystal-electric/20"></div>
            <Code className="w-5 h-5 text-crystal-electric" />
            <span className="text-lg font-bold text-crystal-electric">
              Code Editor
            </span>
          </div>
          {selectedFile && fileContent && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-crystal-void/50 rounded-lg px-3 py-1.5">
                <span className="text-sm text-crystal-text/70">
                  {fileContent.split('\n').length.toLocaleString()} lines
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-crystal-electric/20 rounded-lg px-3 py-1.5 border border-crystal-electric/30">
                <span className="text-sm font-semibold text-crystal-electric">
                  {language.toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Main Content Area */}
      <div className="h-full flex flex-col">
        {!selectedFile ? (
          // Welcome State
          <div className="flex-1 flex items-center justify-center bg-crystal-void/20">
            <div className="text-center space-y-8 max-w-lg">
              <div className="relative">
                <div className="w-32 h-32 mx-auto bg-crystal-electric/20 rounded-3xl flex items-center justify-center border border-crystal-electric/30">
                  <Code className="w-16 h-16 text-crystal-electric" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-crystal-electric rounded-full animate-pulse"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-crystal-electric/60 rounded-full animate-bounce"></div>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-crystal-electric">
                  Select a file to explore
                </h3>
                <p className="text-crystal-text/70 leading-relaxed text-lg">
                  Choose any file from the repository tree to view its content with 
                  <span className="text-crystal-electric font-semibold"> advanced syntax highlighting</span> and 
                  <span className="text-crystal-electric/80 font-semibold"> intelligent code analysis</span>.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-crystal-electric rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-crystal-electric/80 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-crystal-electric/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-crystal-text/60 text-sm font-medium">Ready for code exploration</span>
              </div>
            </div>
          </div>
        ) : isContentLoading ? (
          // Loading State
          <div className="flex-1 flex items-center justify-center bg-crystal-void/20">
            <div className="text-center space-y-8">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-crystal-electric/20 border-t-crystal-electric rounded-full animate-spin mx-auto"></div>
                <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-r-crystal-electric/60 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-crystal-text">
                  Loading file content
                </h3>
                <p className="text-crystal-text/60">
                  Reading <span className="text-crystal-electric font-semibold">{selectedFile.name}</span>
                </p>
              </div>
              <div className="flex items-center justify-center space-x-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div 
                    key={i}
                    className="w-2 h-2 bg-crystal-electric rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        ) : contentError ? (
          // Error State
          <div className="flex-1 flex items-center justify-center bg-crystal-void/20">
            <div className="text-center space-y-6 max-w-md">
              <div className="w-24 h-24 mx-auto bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30">
                <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-red-400">Unable to load file</h3>
                <p className="text-crystal-text/70 text-sm leading-relaxed">
                  {contentError || 'An unexpected error occurred while loading the file content.'}
                </p>
              </div>
              <button className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300 font-semibold">
                Try Again
              </button>
            </div>
          </div>
        ) : fileContent ? (
          // Code Display
          <div className="flex-1 flex flex-col min-h-0">
            {/* File Info Bar */}
            <div className="flex items-center justify-between px-6 py-3 bg-crystal-void/50 border-b border-crystal-electric/20">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-crystal-electric rounded-full animate-pulse"></div>
                <span className="text-crystal-text font-semibold">{selectedFile.name}</span>
                <div className="px-2 py-1 bg-crystal-void/50 rounded text-xs text-crystal-text/60">{language}</div>
              </div>
              <div className="flex items-center space-x-4 text-xs text-crystal-text/60">
                <span>{fileContent.split('\n').length} lines</span>
                <span>•</span>
                <span>{Math.ceil(fileContent.length / 1024)} KB</span>
              </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-auto bg-crystal-void/30">
                <div className="relative">
                  <pre className="p-6 text-sm leading-loose font-mono">
                    <code>
                      {fileContent.split('\n').map((line, index) => (
                        <div 
                          key={index} 
                          className="flex hover:bg-crystal-electric/5 group transition-all duration-200 relative border-l-2 border-transparent hover:border-crystal-electric/30"
                        >
                          {/* Line Number */}
                          <span 
                            className="select-none text-crystal-text/50 text-right pr-6 w-20 flex-shrink-0 group-hover:text-crystal-electric transition-colors duration-200 font-medium sticky left-0 bg-crystal-void/80"
                            style={{ fontSize: '11px' }}
                          >
                            {index + 1}
                          </span>
                          {/* Code Line with Syntax Highlighting */}
                          <span 
                            className="flex-1 text-crystal-text whitespace-pre-wrap break-words"
                            dangerouslySetInnerHTML={{ 
                              __html: syntaxHighlighter(line || ' ', language) 
                            }}
                          />
                        </div>
                      ))}
                    </code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Stats Footer */}
            <div className="bg-crystal-void/50 border-t border-crystal-electric/20 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-crystal-text/70 text-sm">
                      <strong className="text-green-400">{fileContent.split('\n').length.toLocaleString()}</strong> lines
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-crystal-text/70 text-sm">
                      <strong className="text-blue-400">{fileContent.length.toLocaleString()}</strong> chars
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-crystal-electric rounded-full"></div>
                    <span className="text-crystal-text/70 text-sm">
                      <strong className="text-crystal-electric">{Math.ceil(fileContent.length / 1024).toLocaleString()}</strong> KB
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="px-3 py-1 bg-crystal-electric/20 text-crystal-electric text-xs font-semibold rounded-lg border border-crystal-electric/30">
                    {language.toUpperCase()}
                  </div>
                  <span className="text-crystal-text/50 text-xs">UTF-8</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Fallback State
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Code className="w-16 h-16 text-crystal-text/50 mx-auto" />
              <p className="text-crystal-text/60">No content available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

CodeViewer.displayName = 'CodeViewer';

export default CodeViewer;
