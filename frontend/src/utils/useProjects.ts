import { useState, useEffect, useCallback } from 'react';
import brain from 'brain';
import { ProjectResponse } from 'types';

export function useProjects() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {

    setLoading(true);
    setError(null);
    try {

      const response = await brain.get_projects();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setProjects(data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';

      setError(errorMessage);

      setProjects([]);
    } finally {
      setLoading(false);

    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const refetch = useCallback(() => {

    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, error, refetch };
}





