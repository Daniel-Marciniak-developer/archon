import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useGlobalLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [isManualLoading, setIsManualLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!isManualLoading) {
      setIsLoading(true);
      setLoadingMessage('Loading page...');
      
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, isManualLoading]);

  const showLoading = (message: string = 'Loading...') => {
    setLoadingMessage(message);
    setIsLoading(true);
    setIsManualLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
    setIsManualLoading(false);
  };

  const showAnalysisLoading = () => {
    showLoading('Analyzing project...');
  };

  const showUploadLoading = () => {
    showLoading('Uploading files...');
  };

  const showGitHubLoading = () => {
    showLoading('Connecting to GitHub...');
  };

  return {
    isLoading,
    loadingMessage,
    showLoading,
    hideLoading,
    showAnalysisLoading,
    showUploadLoading,
    showGitHubLoading,
  };
};

export default useGlobalLoading;
