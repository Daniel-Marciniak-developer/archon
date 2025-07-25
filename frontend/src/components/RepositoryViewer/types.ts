
export interface FileNode {
  type: 'file' | 'folder';
  path: string;
  name: string;
  children?: FileNode[];
}


export interface RepositoryViewerProps {
  repository: {
    name: string;
    url: string;
    description: string;
    availableBranches: string[];
    currentBranch: string;
  };

  fileTree: FileNode[];

  onFetchFileContent: (path: string) => Promise<string>;

  onBranchChange: (newBranch: string) => void;

  onAnalyzeRequest: () => void;
}


export interface RepoHeaderProps {
  repository: RepositoryViewerProps['repository'];
  onBranchChange: (newBranch: string) => void;
}


export interface FileTreeProps {
  fileTree: FileNode[];
  selectedFile: FileNode | null;
  onFileSelect: (file: FileNode) => void;
}


export interface CodeViewerProps {
  selectedFile: FileNode | null;
  isContentLoading: boolean;
  contentError: string | null;
  fileContent: string | null;
}


export interface RepositoryViewerState {
  selectedFile: FileNode | null;
  isContentLoading: boolean;
  contentError: string | null;
  fileContent: string | null;
}


export interface FileTreeItem extends FileNode {
  isExpanded?: boolean;
  level: number;
  hasChildren: boolean;
  isSelected: boolean;
  isChecked: boolean;
}

