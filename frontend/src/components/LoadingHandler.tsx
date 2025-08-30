import { useLocation } from 'react-router-dom';
import LoadingScreen from './ui/LoadingScreen';
import useGlobalLoading from '../hooks/useGlobalLoading';

interface LoadingHandlerProps {
  children: any;
}

const LoadingHandler = ({ children }: LoadingHandlerProps) => {
  const { isLoading, loadingMessage } = useGlobalLoading();

  return (
    <>
      {children}
      <LoadingScreen isVisible={isLoading} message={loadingMessage} />
    </>
  );
};

export default LoadingHandler;
