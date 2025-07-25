import { useState, useEffect } from 'react';
import { useUser } from '@stackframe/react';
import { stackClientApp } from '@/app/auth';
import brain from 'brain';
import { toast } from 'sonner';
import { GitHubRepo } from 'brain/data-contracts';

interface GitHubConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  username: string | null;
  avatarUrl: string | null;
  accessToken: string | null;
}



export function useGitHubConnection() {
  const user = useUser();
  const [connectionState, setConnectionState] = useState<GitHubConnectionState>({
    isConnected: false,
    isLoading: true,
    error: null,
    username: null,
    avatarUrl: null,
    accessToken: null,
  });
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [repositoriesLoading, setRepositoriesLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false); // Prevent multiple checks


  useEffect(() => {
    if (!user) {
      setConnectionState({
        isConnected: false,
        isLoading: false,
        error: null,
        username: null,
        avatarUrl: null,
        accessToken: null,
      });
      setRepositories([]);
      setHasChecked(false);
      return;
    }


    if (hasChecked) {
      return;
    }


    const timer = setTimeout(() => {
      checkGitHubConnection();
    }, 1000); // Increased delay

    return () => clearTimeout(timer);
  }, [user, hasChecked]);

  const checkGitHubConnection = async () => {
    if (!user) return;

    try {
      setHasChecked(true); // Mark as checked to prevent loops
      setConnectionState(prev => ({ ...prev, isLoading: true, error: null }));




      const response = await brain.get_github_connection_status();

      if (response.ok) {
        const data = await response.json();

        if (data.connected) {
          setConnectionState({
            isConnected: true,
            isLoading: false,
            error: null,
            username: data.username || 'github-user',
            avatarUrl: data.avatar_url || null,
              accessToken: null, // Backend doesn't return access token
            });


            await fetchRepositories();
            return;
        } else {

          setConnectionState({
            isConnected: false,
            isLoading: false,
            error: null,
            username: null,
            avatarUrl: null,
            accessToken: null,
          });
        }
      } else {

        setConnectionState({
          isConnected: false,
          isLoading: false,
          error: 'Failed to check GitHub connection status',
          username: null,
          avatarUrl: null,
          accessToken: null,
        });
      }

    } catch (error) {


      setConnectionState({
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check GitHub connection',
        username: null,
        avatarUrl: null,
        accessToken: null,
      });
    }
  };

  const fetchRepositories = async () => {
    try {
      setRepositoriesLoading(true);


      const response = await brain.get_github_repositories();

      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories || []);

      } else {


        throw new Error(`Failed to fetch repositories: ${response.status}`);
      }
    } catch (error) {



      setRepositories([]);
      toast.error(`Failed to load GitHub repositories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRepositoriesLoading(false);
    }
  };

  const connectGitHub = async () => {
    try {



      const response = await brain.connect_github();

      if (!response.ok) {
        throw new Error('Failed to get GitHub OAuth URL');
      }

      const data = await response.json();


      window.location.href = data.auth_url;


    } catch (error) {

      toast.error(`Failed to connect GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const refreshConnection = async () => {
    setHasChecked(false); // Allow re-checking
    await checkGitHubConnection();
  };

  const refreshRepositories = async () => {
    if (connectionState.isConnected) {
      await fetchRepositories();
    }
  };

  return {

    isConnected: connectionState.isConnected,
    isLoading: connectionState.isLoading,
    error: connectionState.error,
    username: connectionState.username,
    avatarUrl: connectionState.avatarUrl,
    accessToken: connectionState.accessToken,
    

    repositories,
    repositoriesLoading,
    

    connectGitHub,
    refreshConnection,
    refreshRepositories,
  };
}

