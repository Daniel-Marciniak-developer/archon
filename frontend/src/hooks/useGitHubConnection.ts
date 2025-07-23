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

  // Check GitHub connection status when user changes
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

    // Only check once per user session
    if (hasChecked) {
      return;
    }

    // Add delay to prevent rate limiting
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

      console.log('🔗 GitHub: Checking connection via backend API');

      // Use our custom backend API to check GitHub connection
      const response = await brain.get_github_connection_status();

      if (response.ok) {
        const data = await response.json();
        console.log('🔗 GitHub: Backend connection status:', data);

        if (data.connected) {
          setConnectionState({
            isConnected: true,
            isLoading: false,
            error: null,
            username: data.username || 'github-user',
            avatarUrl: data.avatar_url || null,
              accessToken: null, // Backend doesn't return access token
            });

            // Auto-fetch repositories
            await fetchRepositories();
            return;
        } else {
          console.log('🔗 GitHub: Not connected via backend');
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
        console.log('🔗 GitHub: Backend status check failed');
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
      console.error('❌ GitHub: Connection check failed:', error);

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
      console.log('📦 GitHub: Fetching repositories...');

      const response = await brain.get_github_repositories();

      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories || []);
        console.log(`📦 GitHub: Loaded ${data.repositories?.length || 0} repositories`);
      } else {
        // Backend error - show error instead of mock data
        console.error(`📦 GitHub: Backend error ${response.status}`);
        throw new Error(`Failed to fetch repositories: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ GitHub: Repository fetch failed:', error);

      // Set empty repositories and show error
      setRepositories([]);
      toast.error(`Failed to load GitHub repositories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRepositoriesLoading(false);
    }
  };

  const connectGitHub = async () => {
    try {
      console.log('🔗 GitHub: Initiating connection via custom OAuth');

      // Get GitHub OAuth URL from backend
      const response = await brain.connect_github();

      if (!response.ok) {
        throw new Error('Failed to get GitHub OAuth URL');
      }

      const data = await response.json();

      // Redirect to GitHub OAuth
      window.location.href = data.auth_url;

      console.log('🚀 GitHub: Redirecting to GitHub OAuth');
    } catch (error) {
      console.error('❌ GitHub: Connection failed:', error);
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
    // Connection state
    isConnected: connectionState.isConnected,
    isLoading: connectionState.isLoading,
    error: connectionState.error,
    username: connectionState.username,
    avatarUrl: connectionState.avatarUrl,
    accessToken: connectionState.accessToken,
    
    // Repositories
    repositories,
    repositoriesLoading,
    
    // Actions
    connectGitHub,
    refreshConnection,
    refreshRepositories,
  };
}
