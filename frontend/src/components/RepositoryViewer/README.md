# RepositoryViewer Component

Zaawansowany komponent React do przeglądania i interakcji z repozytoriami kodu źródłowego. Zaprojektowany dla platformy SaaS do analizy kodu opartej na AI.

## Funkcjonalności

- **Trzykolumnowy responsywny layout** - drzewo plików, podgląd kodu, panel analizy
- **Wirtualizacja** - wydajne renderowanie dużych struktur plików
- **Podświetlanie składni** - wsparcie dla wielu języków programowania
- **Accessibility-first** - pełna obsługa klawiatury i czytników ekranu
- **Crystal Dark Theme** - nowoczesna, ciemna estetyka inspirowana VS Code
- **Optymalizacje wydajności** - React.memo, lazy loading, memoizacja

## Instalacja

Wymagane zależności:
```bash
npm install react-syntax-highlighter @types/react-syntax-highlighter react-window @types/react-window
```

## Podstawowe użycie

```tsx
import { RepositoryViewer } from '@/components/RepositoryViewer';

const MyComponent = () => {
  const repository = {
    name: 'username/my-project',
    url: 'https://github.com/username/my-project',
    description: 'Opis projektu',
    availableBranches: ['main', 'develop'],
    currentBranch: 'main',
  };

  const fileTree = [
    {
      type: 'folder',
      path: 'src',
      name: 'src',
      children: [
        {
          type: 'file',
          path: 'src/App.tsx',
          name: 'App.tsx',
        },
      ],
    },
  ];

  const handleFetchFileContent = async (path: string) => {
    const response = await fetch(`/api/files/${path}`);
    return response.text();
  };

  const handleBranchChange = (branch: string) => {
    // Logika zmiany gałęzi
  };

  const handleAnalyzeRequest = (filePaths: string[]) => {
    // Logika rozpoczęcia analizy
  };

  return (
    <RepositoryViewer
      repository={repository}
      fileTree={fileTree}
      onFetchFileContent={handleFetchFileContent}
      onBranchChange={handleBranchChange}
      onAnalyzeRequest={handleAnalyzeRequest}
    />
  );
};
```

## API Reference

### RepositoryViewerProps

| Prop | Type | Description |
|------|------|-------------|
| `repository` | `Repository` | Informacje o repozytorium |
| `fileTree` | `FileNode[]` | Struktura plików i folderów |
| `onFetchFileContent` | `(path: string) => Promise<string>` | Funkcja pobierania zawartości pliku |
| `onBranchChange` | `(branch: string) => void` | Callback zmiany gałęzi |
| `onAnalyzeRequest` | `(filePaths: string[]) => void` | Callback rozpoczęcia analizy |

### FileNode

```typescript
interface FileNode {
  type: 'file' | 'folder';
  path: string; // Pełna ścieżka od roota
  name: string; // Nazwa pliku/folderu
  children?: FileNode[]; // Tylko dla folderów
}
```

### Repository

```typescript
interface Repository {
  name: string; // np. "username/project"
  url: string; // URL do GitHub
  description: string;
  availableBranches: string[];
  currentBranch: string;
}
```

## Obsługa klawiatury

### Drzewo plików
- `↑/↓` - Nawigacja po elementach
- `←/→` - Zwijanie/rozwijanie folderów
- `Enter/Space` - Wybór pliku lub przełączenie folderu
- `Home/End` - Przejście do pierwszego/ostatniego elementu

### Ogólne
- `Tab` - Nawigacja między sekcjami
- `Shift+Tab` - Nawigacja wsteczna

## Wsparcie dla języków

Komponent automatycznie rozpoznaje język na podstawie rozszerzenia pliku:

- **JavaScript/TypeScript**: `.js`, `.jsx`, `.ts`, `.tsx`
- **Python**: `.py`
- **Java**: `.java`
- **C/C++**: `.c`, `.cpp`
- **C#**: `.cs`
- **PHP**: `.php`
- **Ruby**: `.rb`
- **Go**: `.go`
- **Rust**: `.rs`
- **HTML/CSS**: `.html`, `.css`, `.scss`
- **Markdown**: `.md`
- **JSON/XML**: `.json`, `.xml`
- **YAML**: `.yaml`, `.yml`
- **Shell**: `.sh`, `.bash`

## Responsywność

- **Desktop (≥1024px)**: Trzykolumnowy layout
- **Tablet (768px-1023px)**: Adaptacyjny layout z możliwością zwijania
- **Mobile (<768px)**: Jednkolumnowy layout z zakładkami

## Accessibility

- **ARIA**: Pełne wsparcie dla czytników ekranu
- **Keyboard Navigation**: Kompletna obsługa klawiatury
- **High Contrast**: Wsparcie dla trybu wysokiego kontrastu
- **Reduced Motion**: Respektowanie preferencji animacji
- **Focus Management**: Wyraźne wskaźniki fokusa

## Optymalizacje wydajności

- **React.memo**: Wszystkie komponenty zoptymalizowane
- **Wirtualizacja**: React Window dla dużych list
- **Lazy Loading**: Zawartość plików ładowana na żądanie
- **Memoizacja**: Callbacks i obliczenia cache'owane

## Stylowanie

Komponent używa Crystal Dark Theme z następującymi klasami CSS:

- `crystal-glass` - Efekt szkła z blur
- `crystal-surface` - Powierzchnie kart
- `crystal-electric` - Kolor akcentu
- `crystal-text-primary/secondary` - Kolory tekstu
- `crystal-border` - Kolory obramowań

## Przykłady

Zobacz plik `example.tsx` dla kompletnego przykładu implementacji.

## Wymagania systemowe

- React 18+
- TypeScript 4.5+
- Node.js 16+

## Licencja

Komponent jest częścią platformy Archon - wszystkie prawa zastrzeżone.
