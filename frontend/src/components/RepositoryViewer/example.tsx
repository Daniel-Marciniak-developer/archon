import React from 'react';
import { RepositoryViewer, FileNode } from './index';

/**
 * Przykład użycia komponentu RepositoryViewer
 * 
 * Ten plik pokazuje jak używać komponentu RepositoryViewer z przykładowymi danymi
 * i implementacjami callbacków.
 */

// Przykładowe dane repozytorium
const exampleRepository = {
  name: 'username/example-project',
  url: 'https://github.com/username/example-project',
  description: 'Przykładowy projekt demonstrujący funkcjonalności RepositoryViewer',
  availableBranches: ['main', 'develop', 'feature/new-ui', 'hotfix/bug-fix'],
  currentBranch: 'main',
};

// Przykładowa struktura plików
const exampleFileTree: FileNode[] = [
  {
    type: 'folder',
    path: 'src',
    name: 'src',
    children: [
      {
        type: 'folder',
        path: 'src/components',
        name: 'components',
        children: [
          {
            type: 'file',
            path: 'src/components/Button.tsx',
            name: 'Button.tsx',
          },
          {
            type: 'file',
            path: 'src/components/Input.tsx',
            name: 'Input.tsx',
          },
          {
            type: 'file',
            path: 'src/components/Modal.tsx',
            name: 'Modal.tsx',
          },
        ],
      },
      {
        type: 'folder',
        path: 'src/utils',
        name: 'utils',
        children: [
          {
            type: 'file',
            path: 'src/utils/helpers.ts',
            name: 'helpers.ts',
          },
          {
            type: 'file',
            path: 'src/utils/api.ts',
            name: 'api.ts',
          },
        ],
      },
      {
        type: 'file',
        path: 'src/App.tsx',
        name: 'App.tsx',
      },
      {
        type: 'file',
        path: 'src/index.tsx',
        name: 'index.tsx',
      },
    ],
  },
  {
    type: 'folder',
    path: 'public',
    name: 'public',
    children: [
      {
        type: 'file',
        path: 'public/index.html',
        name: 'index.html',
      },
      {
        type: 'file',
        path: 'public/favicon.ico',
        name: 'favicon.ico',
      },
    ],
  },
  {
    type: 'file',
    path: 'package.json',
    name: 'package.json',
  },
  {
    type: 'file',
    path: 'README.md',
    name: 'README.md',
  },
  {
    type: 'file',
    path: '.gitignore',
    name: '.gitignore',
  },
];

// Przykładowa zawartość plików
const exampleFileContents: Record<string, string> = {
  'src/components/Button.tsx': `import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={\`btn btn-\${variant}\`}
    >
      {children}
    </button>
  );
};`,
  'src/App.tsx': `import React from 'react';
import { Button } from './components/Button';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Example Project</h1>
        <Button onClick={() => alert('Hello!')}>
          Click me!
        </Button>
      </header>
    </div>
  );
}

export default App;`,
  'package.json': `{
  "name": "example-project",
  "version": "1.0.0",
  "description": "An example project",
  "main": "src/index.tsx",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}`,
  'README.md': `# Example Project

This is an example project demonstrating the RepositoryViewer component.

## Features

- Modern React with TypeScript
- Component-based architecture
- Responsive design

## Getting Started

1. Clone the repository
2. Install dependencies: \`npm install\`
3. Start development server: \`npm start\`
`,
};

// Komponent przykładu
export const RepositoryViewerExample: React.FC = () => {
  // Implementacja funkcji pobierania zawartości pliku
  const handleFetchFileContent = async (path: string): Promise<string> => {
    // Symulacja opóźnienia sieciowego
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Zwróć przykładową zawartość lub błąd
    const content = exampleFileContents[path];
    if (content) {
      return content;
    } else {
      throw new Error(`Plik ${path} nie został znaleziony`);
    }
  };

  // Implementacja zmiany gałęzi
  const handleBranchChange = (newBranch: string) => {
    console.log(`Zmiana gałęzi na: ${newBranch}`);
    // W rzeczywistej aplikacji tutaj byłoby wywołanie API
    // aby pobrać nową strukturę plików dla wybranej gałęzi
  };

  // Implementacja rozpoczęcia analizy
  const handleAnalyzeRequest = (selectedFilePaths: string[]) => {
    console.log('Rozpoczęcie analizy dla plików:', selectedFilePaths);
    // W rzeczywistej aplikacji tutaj byłoby wywołanie API
    // aby rozpocząć analizę wybranych plików
  };

  return (
    <RepositoryViewer
      repository={exampleRepository}
      fileTree={exampleFileTree}
      onFetchFileContent={handleFetchFileContent}
      onBranchChange={handleBranchChange}
      onAnalyzeRequest={handleAnalyzeRequest}
    />
  );
};

export default RepositoryViewerExample;
