// Definicja węzła w drzewie plików - może to być plik lub folder
export interface FileNode {
  type: 'file' | 'folder';
  path: string; // Pełna ścieżka od roota repozytorium, np. "src/components/Button.tsx"
  name: string; // Sama nazwa, np. "Button.tsx"
  children?: FileNode[]; // Istnieje tylko dla type: 'folder'
}

// Dane wejściowe dla całego komponentu
export interface RepositoryViewerProps {
  // Informacje o samym repozytorium i aktualnie wybranej gałęzi
  repository: {
    name: string; // np. "username/my-cool-project"
    url: string; // URL do repozytorium na GitHubie
    description: string;
    availableBranches: string[]; // Lista dostępnych gałęzi, np. ["main", "develop", "feature/new-ui"]
    currentBranch: string;
  };

  // Kompletna struktura plików i folderów dla wybranej gałęzi
  fileTree: FileNode[];

  // Asynchroniczna funkcja do pobierania zawartości pliku.
  // Zwraca Promise z zawartością pliku jako string.
  // Komponent powinien obsłużyć stany ładowania i błędu.
  onFetchFileContent: (path: string) => Promise<string>;

  // Callback wywoływany przy zmianie gałęzi przez użytkownika
  onBranchChange: (newBranch: string) => void;

  // Callback wywoływany, gdy użytkownik jest gotowy do rozpoczęcia analizy.
  // Przekazuje listę ścieżek do plików, które zostały wybrane.
  onAnalyzeRequest: (selectedFilePaths: string[]) => void;
}

// Props dla komponentu RepoHeader
export interface RepoHeaderProps {
  repository: RepositoryViewerProps['repository'];
  onBranchChange: (newBranch: string) => void;
}

// Props dla komponentu FileTree
export interface FileTreeProps {
  fileTree: FileNode[];
  selectedFile: FileNode | null;
  filesForAnalysis: string[];
  onFileSelect: (file: FileNode) => void;
  onFilesForAnalysisChange: (filePaths: string[]) => void;
}

// Props dla komponentu CodeViewer
export interface CodeViewerProps {
  selectedFile: FileNode | null;
  isContentLoading: boolean;
  contentError: string | null;
  fileContent: string | null;
}

// Stan wewnętrzny komponentu RepositoryViewer
export interface RepositoryViewerState {
  selectedFile: FileNode | null;
  filesForAnalysis: string[];
  isContentLoading: boolean;
  contentError: string | null;
  fileContent: string | null;
}

// Typ dla elementu drzewa plików z dodatkowymi właściwościami UI
export interface FileTreeItem extends FileNode {
  isExpanded?: boolean;
  level: number;
  hasChildren: boolean;
  isSelected: boolean;
  isChecked: boolean;
}
