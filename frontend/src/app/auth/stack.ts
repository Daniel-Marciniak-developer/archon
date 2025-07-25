import { APP_BASE_PATH } from '@/constants';
import { StackClientApp } from '@stackframe/react';
import { useNavigate } from 'react-router-dom';
import { config } from './config';
import { joinPaths } from './utils';

export const stackClientApp = new StackClientApp({
  projectId: config.projectId,
  publishableClientKey: config.publishableClientKey,
  tokenStore: 'cookie', // Use cookies for OAuth flow to work properly
  redirectMethod: {
    useNavigate
  },
  urls: {
    handler: '/auth',
    home: '/',
    afterSignIn: '/dashboard',
    afterSignUp: '/dashboard'
  }
})










