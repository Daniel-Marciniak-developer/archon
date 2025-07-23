import React from 'react';
import { ExternalLink, GitBranch } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RepoHeaderProps } from './types';

/**
 * RepoHeader - Komponent wyświetlający informacje o repozytorium
 * 
 * Wyświetla nazwę repozytorium (jako link do GitHub), opis oraz selektor gałęzi.
 * Utrzymany w ciemnej estetyce Crystal theme inspirowanej VS Code.
 */
export const RepoHeader: React.FC<RepoHeaderProps> = React.memo(({
  repository,
  onBranchChange,
}) => {
  return (
    <Card className="crystal-glass border-crystal-border mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Nazwa repozytorium jako link */}
            <div className="flex items-center space-x-2 mb-2">
              <h1 className="text-xl font-semibold text-crystal-text-primary truncate">
                <a
                  href={repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-crystal-electric transition-colors duration-200 flex items-center space-x-2"
                  aria-label={`Otwórz repozytorium ${repository.name} w nowej karcie`}
                >
                  <span>{repository.name}</span>
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                </a>
              </h1>
            </div>

            {/* Opis repozytorium */}
            {repository.description && (
              <p className="text-crystal-text-secondary text-sm leading-relaxed">
                {repository.description}
              </p>
            )}
          </div>

          {/* Selektor gałęzi */}
          <div className="flex-shrink-0 ml-4">
            <div className="flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-crystal-text-secondary" />
              <Select
                value={repository.currentBranch}
                onValueChange={onBranchChange}
              >
                <SelectTrigger 
                  className="w-40 crystal-surface border-crystal-border focus:border-crystal-electric"
                  aria-label="Wybierz gałąź"
                >
                  <SelectValue placeholder="Wybierz gałąź" />
                </SelectTrigger>
                <SelectContent className="crystal-surface border-crystal-border">
                  {repository.availableBranches.map((branch) => (
                    <SelectItem
                      key={branch}
                      value={branch}
                      className="text-crystal-text-primary hover:bg-crystal-electric/10 focus:bg-crystal-electric/10"
                    >
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
});

RepoHeader.displayName = 'RepoHeader';

export default RepoHeader;
