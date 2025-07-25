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

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileTreeProps, FileNode, FileTreeItem } from './types';


export const FileTree: React.FC<FileTreeProps> = React.memo(({
  fileTree,
  selectedFile,
  onFileSelect,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());


  useEffect(() => {
    if (fileTree.length > 0 && expandedFolders.size === 0) {
      const autoExpandFolders = new Set<string>();


      fileTree.forEach(item => {
        if (item.type === 'folder') {
          autoExpandFolders.add(item.path);
        }
      });


      setExpandedFolders(autoExpandFolders);
    }
  }, [fileTree, expandedFolders.size]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);


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





  const flattenTree = useCallback((
    nodes: FileNode[],
    level: number = 0,
    result: FileTreeItem[] = []
  ): FileTreeItem[] => {
    for (const node of nodes) {
      const isExpanded = expandedFolders.has(node.path);
      const isSelected = selectedFile?.path === node.path;

      result.push({
        ...node,
        level,
        hasChildren: node.type === 'folder' && (node.children?.length || 0) > 0,
        isExpanded,
        isSelected,
        isChecked: false,
      });


      if (node.type === 'folder' && isExpanded && node.children) {
        flattenTree(node.children, level + 1, result);
      }
    }

    return result;
  }, [expandedFolders, selectedFile]);


  const flatItems = useMemo(() => {
    const items = flattenTree(fileTree);


    return items;
  }, [flattenTree, fileTree, expandedFolders]);


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


  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      listRef.current.scrollToItem(focusedIndex, 'smart');
    }
  }, [focusedIndex]);


  const TreeItem: React.FC<{ index: number; style: React.CSSProperties }> = React.memo(({
    index,
    style
  }) => {
    const item = flatItems[index];
    const IconComponent = item.type === 'folder'
      ? (item.isExpanded ? FolderOpen : Folder)
      : getFileIcon(item.name);


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


          {}
          {item.type === 'folder' && item.hasChildren && (
            <button
              onClick={() => toggleFolder(item.path)}
              className="mr-1 p-0.5 hover:bg-crystal-electric/10 rounded"
              aria-label={`${item.isExpanded ? 'Collapse' : 'Expand'} folder ${item.name}`}
            >
              {item.isExpanded ? (
                <ChevronDown className="w-4 h-4 text-crystal-text-secondary" />
              ) : (
                <ChevronRight className="w-4 h-4 text-crystal-text-secondary" />
              )}
            </button>
          )}

          {}
          <IconComponent 
            className={`w-4 h-4 mr-2 flex-shrink-0 ${
              item.type === 'folder' 
                ? 'text-crystal-electric' 
                : 'text-crystal-text-secondary'
            }`} 
          />

          {}
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

    return prevProps.index === nextProps.index &&
           JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style);
  });

  return (
    <Card className="crystal-glass border-crystal-border h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-crystal-text-primary flex items-center">
          <Folder className="w-5 h-5 mr-2 text-crystal-electric" />
          File Structure
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-full">
        <div
          className="h-96 overflow-hidden"
          ref={containerRef}
          role="tree"
          aria-label="Repository file structure"
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

