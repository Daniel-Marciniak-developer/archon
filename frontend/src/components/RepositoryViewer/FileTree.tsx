import React, { useState, useCallback, useMemo } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, GitBranch, Search, Code2, FileText, Database, Settings, Image, Video, Archive, Key, Lock } from 'lucide-react';
import { FileTreeProps, FileNode } from './types';

const getFileTypeInfo = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const typeMap: Record<string, { icon: React.ReactNode; color: string; category: string; bg: string }> = {
    'ts': { icon: <Code2 className="w-4 h-4" />, color: 'text-blue-400', category: 'TypeScript', bg: 'bg-blue-500/10 border-blue-500/30' },
    'tsx': { icon: <Code2 className="w-4 h-4" />, color: 'text-blue-300', category: 'React', bg: 'bg-blue-500/10 border-blue-500/30' },
    'js': { icon: <Code2 className="w-4 h-4" />, color: 'text-yellow-400', category: 'JavaScript', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    'jsx': { icon: <Code2 className="w-4 h-4" />, color: 'text-yellow-300', category: 'React', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    'py': { icon: <Code2 className="w-4 h-4" />, color: 'text-green-400', category: 'Python', bg: 'bg-green-500/10 border-green-500/30' },
    'html': { icon: <Code2 className="w-4 h-4" />, color: 'text-orange-400', category: 'HTML', bg: 'bg-orange-500/10 border-orange-500/30' },
    'css': { icon: <Code2 className="w-4 h-4" />, color: 'text-purple-400', category: 'CSS', bg: 'bg-purple-500/10 border-purple-500/30' },
    'scss': { icon: <Code2 className="w-4 h-4" />, color: 'text-pink-400', category: 'SCSS', bg: 'bg-pink-500/10 border-pink-500/30' },
    
    'json': { icon: <Database className="w-4 h-4" />, color: 'text-cyan-400', category: 'JSON', bg: 'bg-cyan-500/10 border-cyan-500/30' },
    'yaml': { icon: <Settings className="w-4 h-4" />, color: 'text-indigo-400', category: 'YAML', bg: 'bg-indigo-500/10 border-indigo-500/30' },
    'yml': { icon: <Settings className="w-4 h-4" />, color: 'text-indigo-400', category: 'YAML', bg: 'bg-indigo-500/10 border-indigo-500/30' },
    'xml': { icon: <Database className="w-4 h-4" />, color: 'text-amber-400', category: 'XML', bg: 'bg-amber-500/10 border-amber-500/30' },
    
    'md': { icon: <FileText className="w-4 h-4" />, color: 'text-crystal-text/70', category: 'Markdown', bg: 'bg-crystal-void/30 border-crystal-electric/20' },
    'txt': { icon: <FileText className="w-4 h-4" />, color: 'text-crystal-text/60', category: 'Text', bg: 'bg-crystal-void/30 border-crystal-electric/20' },
    'pdf': { icon: <FileText className="w-4 h-4" />, color: 'text-red-400', category: 'PDF', bg: 'bg-red-500/10 border-red-500/30' },
    
    'png': { icon: <Image className="w-4 h-4" />, color: 'text-emerald-400', category: 'Image', bg: 'bg-emerald-500/10 border-emerald-500/30' },
    'jpg': { icon: <Image className="w-4 h-4" />, color: 'text-emerald-400', category: 'Image', bg: 'bg-emerald-500/10 border-emerald-500/30' },
    'svg': { icon: <Image className="w-4 h-4" />, color: 'text-teal-400', category: 'Vector', bg: 'bg-teal-500/10 border-teal-500/30' },
    'mp4': { icon: <Video className="w-4 h-4" />, color: 'text-violet-400', category: 'Video', bg: 'bg-violet-500/10 border-violet-500/30' },
    
    'zip': { icon: <Archive className="w-4 h-4" />, color: 'text-orange-400', category: 'Archive', bg: 'bg-orange-500/10 border-orange-500/30' },
    'env': { icon: <Key className="w-4 h-4" />, color: 'text-red-300', category: 'Config', bg: 'bg-red-500/10 border-red-500/30' },
    'key': { icon: <Lock className="w-4 h-4" />, color: 'text-red-400', category: 'Security', bg: 'bg-red-500/10 border-red-500/30' },
  };
  
  return typeMap[ext] || { 
    icon: <File className="w-4 h-4" />, 
    color: 'text-slate-400', 
    category: 'File',
    bg: 'bg-slate-500/10 border-slate-500/30'
  };
};

const FileTree: React.FC<FileTreeProps> = ({ fileTree, selectedFile, onFileSelect }) => {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const toggleDirectory = useCallback((path: string) => {
    setExpandedDirs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  const filteredTree = useMemo(() => {
    if (!searchTerm) return fileTree;
    
    const filterItems = (items: FileNode[]): FileNode[] => {
      return items.filter(item => {
        if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return true;
        }
        if (item.children) {
          const filteredChildren = filterItems(item.children);
          if (filteredChildren.length > 0) {
            return true;
          }
        }
        return false;
      }).map(item => ({
        ...item,
        children: item.children ? filterItems(item.children) : undefined
      }));
    };
    
    return filterItems(fileTree);
  }, [fileTree, searchTerm]);

  const renderFileSystemItem = (item: FileNode, depth: number = 0) => {
    const isExpanded = expandedDirs.has(item.path);
    const isSelected = selectedFile?.path === item.path;
    const isHovered = hoveredItem === item.path;
    const typeInfo = item.type === 'file' ? getFileTypeInfo(item.name) : null;
    
    const handleClick = () => {
      if (item.type === 'folder') {
        toggleDirectory(item.path);
      } else {
        onFileSelect(item);
      }
    };

    return (
      <div key={item.path} className="select-none">
        <div
          className={`
            group flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 transform
            ${depth > 0 ? `ml-${Math.min(depth * 4, 16)}` : ''}
            ${isSelected 
              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-l-4 border-cyan-400 shadow-lg shadow-cyan-500/10' 
              : isHovered 
                ? 'bg-gradient-to-r from-slate-700/50 to-slate-600/50 shadow-md' 
                : 'hover:bg-gradient-to-r hover:from-slate-700/30 hover:to-slate-600/30'
            }
          `}
          onClick={handleClick}
          onMouseEnter={() => setHoveredItem(item.path)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {/* Directory Chevron */}
          {item.type === 'folder' && (
            <div className="flex-shrink-0 mr-2">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              )}
            </div>
          )}
          
          {/* File/Directory Icon */}
          <div className="flex-shrink-0 mr-3">
            {item.type === 'folder' ? (
              isExpanded ? (
                <FolderOpen className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
              ) : (
                <Folder className="w-5 h-5 text-yellow-500 group-hover:text-yellow-400 transition-colors" />
              )
            ) : (
              <div className={`${typeInfo?.color || 'text-slate-400'} group-hover:scale-110 transition-transform`}>
                {typeInfo?.icon || <File className="w-4 h-4" />}
              </div>
            )}
          </div>
          
          {/* Name */}
          <div className="flex-1 min-w-0">
            <span className={`
              text-sm font-medium truncate block
              ${isSelected 
                ? 'text-white font-bold' 
                : item.type === 'folder'
                  ? 'text-slate-200 group-hover:text-white'
                  : 'text-slate-300 group-hover:text-slate-100'
              }
            `}>
              {item.name}
            </span>
          </div>
          
          {/* File Type Badge */}
          {item.type === 'file' && typeInfo && (
            <div className={`
              flex-shrink-0 ml-2 px-2 py-1 rounded-md border text-xs font-bold
              ${typeInfo.bg}
              ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
              transition-opacity duration-200
            `}>
              {typeInfo.category}
            </div>
          )}
          
          {/* Directory Counter */}
          {item.type === 'folder' && item.children && (
            <div className={`
              flex-shrink-0 ml-2 px-2 py-1 bg-slate-700/50 text-slate-400 text-xs font-bold rounded-md border border-slate-600/30
              ${isSelected || isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
              transition-opacity duration-200
            `}>
              {item.children.length}
            </div>
          )}
        </div>
        
        {/* Children */}
        {item.type === 'folder' && item.children && isExpanded && (
          <div className="ml-2 border-l border-crystal-electric/20 relative">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-crystal-electric/30 via-crystal-electric/20 to-transparent"></div>
            {item.children.map(child => renderFileSystemItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-crystal-void/30">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-crystal-electric/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-crystal-electric flex items-center">
            <GitBranch className="w-5 h-5 mr-2" />
            Files
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-green-400">{fileTree.length}</span>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-crystal-text/60" />
          <input
            type="text"
            placeholder="Search files & folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-crystal-void/50 border border-crystal-electric/20 rounded-xl text-crystal-text placeholder-crystal-text/50 focus:outline-none focus:ring-2 focus:ring-crystal-electric/50 focus:border-crystal-electric/50 transition-all duration-200"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-crystal-text/60 hover:text-crystal-text transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      {/* File Tree Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-1">
          {filteredTree.length > 0 ? (
            filteredTree.map(item => renderFileSystemItem(item))
          ) : searchTerm ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-crystal-text/40 mx-auto mb-4" />
              <p className="text-crystal-text/60 text-sm">No files found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Folder className="w-12 h-12 text-crystal-text/40 mx-auto mb-4" />
              <p className="text-crystal-text/60 text-sm">No files available</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Enhanced Footer Stats */}
      <div className="flex-shrink-0 p-4 border-t border-slate-600/30">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-slate-400">Folders</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span className="text-slate-400">Files</span>
            </div>
          </div>
          {searchTerm && (
            <div className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded border border-cyan-500/30 font-bold">
              {filteredTree.length} matches
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileTree;

