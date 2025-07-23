# Wymagane zależności dla RepositoryViewer

## Zależności produkcyjne

Następujące pakiety muszą być zainstalowane w projekcie:

```bash
npm install react-syntax-highlighter react-window
```

## Zależności deweloperskie (typy TypeScript)

```bash
npm install --save-dev @types/react-syntax-highlighter @types/react-window
```

## Już zainstalowane w projekcie

Komponent wykorzystuje następujące zależności, które są już dostępne w projekcie:

- `react` (18.3.1)
- `react-dom` (18.3.1)
- `lucide-react` (^0.439.0)
- `@radix-ui/react-checkbox` (^1.1.1)
- `@radix-ui/react-select` (^2.1.1)
- `class-variance-authority` (^0.7.0)
- `clsx` (^2.1.1)
- `tailwind-merge` (^2.5.2)

## Szczegóły pakietów

### react-syntax-highlighter
- **Wersja**: Najnowsza stabilna
- **Cel**: Podświetlanie składni kodu w komponencie CodeViewer
- **Motyw**: `atomDark` (kompatybilny z Crystal Dark Theme)
- **Wsparcie języków**: JavaScript, TypeScript, Python, Java, C++, i wiele innych

### react-window
- **Wersja**: Najnowsza stabilna
- **Cel**: Wirtualizacja listy w komponencie FileTree
- **Wydajność**: Umożliwia płynne renderowanie tysięcy elementów
- **Komponent**: `FixedSizeList` dla równomiernych wysokości elementów

## Kompatybilność

Wszystkie zależności są kompatybilne z:
- React 18+
- TypeScript 4.5+
- Node.js 16+
- Wszystkimi nowoczesnymi przeglądarkami

## Rozmiar bundle'a

Szacunkowy wpływ na rozmiar bundle'a:
- `react-syntax-highlighter`: ~200KB (z językami)
- `react-window`: ~15KB
- **Łącznie**: ~215KB dodatkowego kodu

## Optymalizacje

Aby zminimalizować rozmiar bundle'a, można:

1. **Importować tylko potrzebne języki**:
```typescript
// Zamiast importu wszystkich języków
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

// Importuj tylko potrzebne
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { javascript, typescript, python } from 'react-syntax-highlighter/dist/esm/languages/prism';

SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('python', python);
```

2. **Lazy loading komponentów**:
```typescript
const RepositoryViewer = React.lazy(() => import('./RepositoryViewer'));
```

## Instalacja w projekcie

Wykonaj następujące polecenie w katalogu `frontend/`:

```bash
npm install react-syntax-highlighter react-window @types/react-syntax-highlighter @types/react-window --legacy-peer-deps
```

Flaga `--legacy-peer-deps` jest wymagana ze względu na konflikty zależności w obecnym projekcie.
