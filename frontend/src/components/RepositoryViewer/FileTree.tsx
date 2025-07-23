import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileImage,
  Settings
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileTreeProps, FileNode, FileTreeItem } from './types';

/**
 * FileTree - Komponent drzewa plików z wirtualizacją
 * 
 * Renderuje rekursywnie strukturę plików z checkboxami, obsługuje zwijanie/rozwijanie
 * folderów oraz wirtualizację dla wydajności przy dużych repozytoriach.
 */
export const FileTree: React.FC<FileTreeProps> = React.memo(({
  fileTree,
  selectedFile,
  filesForAnalysis,
  onFileSelect,
  onFilesForAnalysisChange,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Funkcja do uzyskania ikony pliku na podstawie rozszerzenia
  const getFileIcon = useCallback((fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
      case 'cs':
      case 'php':
      case 'rb':
      case 'go':
      case 'rs':
        return FileCode;
      case 'md':
      case 'txt':
      case 'doc':
      case 'docx':
        return FileText;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
        return FileImage;
      case 'json':
      case 'xml':
      case 'yaml':
      case 'yml':
      case 'toml':
      case 'ini':
        return Settings;
      default:
        return File;
    }
  }, []);

  // Funkcja do przełączania stanu rozwinięcia folderu
  const toggleFolder = useCallback((folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  }, []);

  // Funkcja do zbierania wszystkich ścieżek plików w folderze (rekursywnie)
  const collectFilePaths = useCallback((node: FileNode): string[] => {
    if (node.type === 'file') {
      return [node.path];
    }
    
    if (node.children) {
      return node.children.flatMap(child => collectFilePaths(child));
    }
    
    return [];
  }, []);

  // Funkcja do obsługi zmiany stanu checkbox
  const handleCheckboxChange = useCallback((node: FileNode, checked: boolean) => {
    const filePaths = collectFilePaths(node);
    
    if (checked) {
      // Dodaj wszystkie pliki z tego węzła
      const newFilesForAnalysis = [...new Set([...filesForAnalysis, ...filePaths])];
      onFilesForAnalysisChange(newFilesForAnalysis);
    } else {
      // Usuń wszystkie pliki z tego węzła
      const newFilesForAnalysis = filesForAnalysis.filter(path => !filePaths.includes(path));
      onFilesForAnalysisChange(newFilesForAnalysis);
    }
  }, [filesForAnalysis, onFilesForAnalysisChange, collectFilePaths]);

  // Funkcja do sprawdzenia czy węzeł jest zaznaczony
  const isNodeChecked = useCallback((node: FileNode): boolean => {
    const filePaths = collectFilePaths(node);
    return filePaths.length > 0 && filePaths.every(path => filesForAnalysis.includes(path));
  }, [filesForAnalysis, collectFilePaths]);

  // Funkcja do sprawdzenia czy węzeł jest częściowo zaznaczony
  const isNodeIndeterminate = useCallback((node: FileNode): boolean => {
    if (node.type === 'file') return false;
    
    const filePaths = collectFilePaths(node);
    const checkedPaths = filePaths.filter(path => filesForAnalysis.includes(path));
    
    return checkedPaths.length > 0 && checkedPaths.length < filePaths.length;
  }, [filesForAnalysis, collectFilePaths]);

  // Funkcja do spłaszczenia drzewa plików do listy z poziomami
  const flattenTree = useCallback((
    nodes: FileNode[], 
    level: number = 0, 
    result: FileTreeItem[] = []
  ): FileTreeItem[] => {
    for (const node of nodes) {
      const isExpanded = expandedFolders.has(node.path);
      const isSelected = selectedFile?.path === node.path;
      const isChecked = isNodeChecked(node);
      
      result.push({
        ...node,
        level,
        hasChildren: node.type === 'folder' && (node.children?.length || 0) > 0,
        isExpanded,
        isSelected,
        isChecked,
      });

      // Jeśli folder jest rozwinięty, dodaj jego dzieci
      if (node.type === 'folder' && isExpanded && node.children) {
        flattenTree(node.children, level + 1, result);
      }
    }
    
    return result;
  }, [expandedFolders, selectedFile, isNodeChecked]);

  // Spłaszczona lista elementów do wyświetlenia
  const flatItems = useMemo(() => flattenTree(fileTree), [flattenTree, fileTree]);

  // Obsługa klawiatury dla accessibility
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (flatItems.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, flatItems.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (focusedIndex >= 0) {
          const item = flatItems[focusedIndex];
          if (item.type === 'folder' && !item.isExpanded) {
            toggleFolder(item.path);
          }
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (focusedIndex >= 0) {
          const item = flatItems[focusedIndex];
          if (item.type === 'folder' && item.isExpanded) {
            toggleFolder(item.path);
          }
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0) {
          const item = flatItems[focusedIndex];
          if (item.type === 'file') {
            onFileSelect(item);
          } else {
            toggleFolder(item.path);
          }
        }
        break;
      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setFocusedIndex(flatItems.length - 1);
        break;
    }
  }, [flatItems, focusedIndex, toggleFolder, onFileSelect]);

  // Efekt do przewijania do fokusowanego elementu
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      listRef.current.scrollToItem(focusedIndex, 'smart');
    }
  }, [focusedIndex]);

  // Komponent pojedynczego elementu w liście - zoptymalizowany z React.memo
  const TreeItem: React.FC<{ index: number; style: React.CSSProperties }> = React.memo(({
    index,
    style
  }) => {
    const item = flatItems[index];
    const IconComponent = item.type === 'folder'
      ? (item.isExpanded ? FolderOpen : Folder)
      : getFileIcon(item.name);

    const isIndeterminate = isNodeIndeterminate(item);
    const isFocused = focusedIndex === index;

    return (
      <div style={style} className="flex items-center">
        <div
          className={`
            flex items-center w-full px-2 py-1 hover:bg-crystal-surface/50 cursor-pointer
            ${item.isSelected ? 'bg-crystal-electric/20 border-l-2 border-crystal-electric' : ''}
            ${isFocused ? 'ring-2 ring-crystal-electric ring-inset' : ''}
          `}
          style={{ paddingLeft: `${item.level * 20 + 8}px` }}
          role="treeitem"
          aria-expanded={item.type === 'folder' ? item.isExpanded : undefined}
          aria-selected={item.isSelected}
          aria-level={item.level + 1}
          aria-label={`${item.type === 'folder' ? 'Folder' : 'File'}: ${item.name}`}
          tabIndex={isFocused ? 0 : -1}
          onClick={() => {
            setFocusedIndex(index);
            if (item.type === 'file') {
              onFileSelect(item);
            } else {
              toggleFolder(item.path);
            }
          }}
        >
          {/* Checkbox */}
          <Checkbox
            checked={item.isChecked}
            ref={(ref) => {
              if (ref && isIndeterminate) {
                ref.indeterminate = true;
              }
            }}
            onCheckedChange={(checked) => handleCheckboxChange(item, !!checked)}
            className="mr-2 crystal-border-electric"
            aria-label={`${item.isChecked ? 'Odznacz' : 'Zaznacz'} ${item.name}`}
          />

          {/* Ikona rozwijania dla folderów */}
          {item.type === 'folder' && item.hasChildren && (
            <button
              onClick={() => toggleFolder(item.path)}
              className="mr-1 p-0.5 hover:bg-crystal-electric/10 rounded"
              aria-label={`${item.isExpanded ? 'Zwiń' : 'Rozwiń'} folder ${item.name}`}
            >
              {item.isExpanded ? (
                <ChevronDown className="w-4 h-4 text-crystal-text-secondary" />
              ) : (
                <ChevronRight className="w-4 h-4 text-crystal-text-secondary" />
              )}
            </button>
          )}

          {/* Ikona pliku/folderu */}
          <IconComponent 
            className={`w-4 h-4 mr-2 flex-shrink-0 ${
              item.type === 'folder' 
                ? 'text-crystal-electric' 
                : 'text-crystal-text-secondary'
            }`} 
          />

          {/* Nazwa pliku/folderu */}
          <span
            onClick={() => item.type === 'file' && onFileSelect(item)}
            className={`
              text-sm truncate flex-1 
              ${item.type === 'file' ? 'hover:text-crystal-electric cursor-pointer' : ''}
              ${item.isSelected ? 'text-crystal-electric font-medium' : 'text-crystal-text-primary'}
            `}
            title={item.name}
          >
            {item.name}
          </span>
        </div>
      </div>
    );
  }, (prevProps, nextProps) => {
    // Optymalizacja porównania dla React.memo
    return prevProps.index === nextProps.index &&
           JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style);
  });

  return (
    <Card className="crystal-glass border-crystal-border h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-crystal-text-primary flex items-center">
          <Folder className="w-5 h-5 mr-2 text-crystal-electric" />
          Struktura Plików
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-full">
        <div
          className="h-96 overflow-hidden"
          ref={containerRef}
          role="tree"
          aria-label="Struktura plików repozytorium"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (focusedIndex === -1 && flatItems.length > 0) {
              setFocusedIndex(0);
            }
          }}
        >
          <List
            ref={listRef}
            height={384} // 24rem = 384px
            itemCount={flatItems.length}
            itemSize={32}
            className="crystal-scrollbar"
          >
            {TreeItem}
          </List>
        </div>
      </CardContent>
    </Card>
  );
});

FileTree.displayName = 'FileTree';

export default FileTree;
