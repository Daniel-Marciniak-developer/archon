
export interface FileNode {
  type: 'file' | 'folder';
  path: string; // Pełna ścieżka od roota repozytorium, np. "src/components/Button.tsx"
  name: string; // Sama nazwa, np. "Button.tsx"
  children?: FileNode[]; // Istnieje tylko dla type: 'folder'
}


export interface RepositoryViewerProps {

  repository: {
    name: string; // np. "username/my-cool-project"
    url: string; // URL do repozytorium na GitHubie
    description: string;
    availableBranches: string[]; // Lista dostępnych gałęzi, np. ["main", "develop", "feature/new-ui"]
    currentBranch: string;
  };


  fileTree: FileNode[];




  onFetchFileContent: (path: string) => Promise<string>;


  onBranchChange: (newBranch: string) => void;



  onAnalyzeRequest: (selectedFilePaths: string[]) => void;
}


export interface RepoHeaderProps {
  repository: RepositoryViewerProps['repository'];
  onBranchChange: (newBranch: string) => void;
}


export interface FileTreeProps {
  fileTree: FileNode[];
  selectedFile: FileNode | null;
  filesForAnalysis: string[];
  onFileSelect: (file: FileNode) => void;
  onFilesForAnalysisChange: (filePaths: string[]) => void;
}


export interface CodeViewerProps {
  selectedFile: FileNode | null;
  isContentLoading: boolean;
  contentError: string | null;
  fileContent: string | null;
}


export interface RepositoryViewerState {
  selectedFile: FileNode | null;
  filesForAnalysis: string[];
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

