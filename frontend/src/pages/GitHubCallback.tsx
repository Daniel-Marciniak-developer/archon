import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import brain from 'brain';
import { LoadingSpinner } from 'components/LoadingSpinner';

export default function GitHubCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing GitHub authentication...');
  const [hasProcessed, setHasProcessed] = useState(false); // Prevent double processing

  useEffect(() => {
    // Prevent double processing in React Strict Mode
    if (hasProcessed) {
      return;
    }
    const handleCallback = async () => {
      try {
        setHasProcessed(true); // Mark as processed immediately

        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`GitHub OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received from GitHub');
        }

        console.log('🔗 GitHub: Processing OAuth callback with code:', code);
        setMessage('Exchanging authorization code for access token...');

        // Send code to backend to exchange for access token
        const response = await brain.github_oauth_callback({
          code,
          state: state || undefined
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Failed to process GitHub authentication');
        }

        const data = await response.json();
        console.log('✅ GitHub: Authentication successful:', data);

        setStatus('success');
        setMessage(`Successfully connected GitHub account: ${data.github_username}`);
        
        toast.success(`GitHub account connected: ${data.github_username}`);

        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);

      } catch (error) {
        console.error('❌ GitHub: Callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Unknown error occurred');
        
        toast.error(`GitHub connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

        // Redirect to dashboard after delay even on error
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="mb-4">
            {status === 'processing' && (
              <LoadingSpinner className="mx-auto" />
            )}
            {status === 'success' && (
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {status === 'processing' && 'Connecting GitHub Account'}
            {status === 'success' && 'GitHub Connected!'}
            {status === 'error' && 'Connection Failed'}
          </h2>
          
          <p className="text-gray-600 mb-4">
            {message}
          </p>
          
          {status !== 'processing' && (
            <button
              onClick={() => navigate('/dashboard', { replace: true })}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Continue to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
