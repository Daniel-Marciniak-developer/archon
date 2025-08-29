import { useState, useEffect, useCallback, useRef } from 'react';
import brain from 'brain';
import { ProjectResponse } from 'types';
import useGlobalLoading from '@/hooks/useGlobalLoading';

export function useProjects() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const projectsRef = useRef<ProjectResponse[]>([]);
  const previousRunningAnalysisRef = useRef<boolean>(false);
  const { hideLoading } = useGlobalLoading();

  const fetchProjects = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const response = await brain.get_projects();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setProjects(data);
      projectsRef.current = data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
      setError(errorMessage);
      setProjects([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const interval = setInterval(() => {
      const hasRunningAnalysis = projectsRef.current.some(project =>
        project.latest_analysis &&
        (project.latest_analysis.status === 'pending' || project.latest_analysis.status === 'running')
      );

      if (previousRunningAnalysisRef.current && !hasRunningAnalysis) {
        hideLoading();
      }

      previousRunningAnalysisRef.current = hasRunningAnalysis;

      if (hasRunningAnalysis) {
        fetchProjects(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchProjects, hideLoading]);

  const refetch = useCallback(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, error, refetch };
}





