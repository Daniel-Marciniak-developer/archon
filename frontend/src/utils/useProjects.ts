import { useState, useEffect, useCallback } from 'react';
import brain from 'brain';
import { ProjectResponse } from 'types';

export function useProjects() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    console.log('📊 useProjects: Starting to fetch projects...');
    setLoading(true);
    setError(null);
    try {
      console.log('☁️ useProjects: Fetching real data from backend');
      const response = await brain.get_projects();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setProjects(data);
      console.log(`✅ useProjects: Loaded ${data.length} projects`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
      console.error('❌ useProjects: Error fetching projects:', errorMessage);
      setError(errorMessage);
      // Don't use mock data as fallback - show the error
      setProjects([]);
    } finally {
      setLoading(false);
      console.log('🏁 useProjects: Fetch operation completed');
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const refetch = useCallback(() => {
    console.log('🔄 useProjects: Manual refetch triggered');
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, error, refetch };
}




