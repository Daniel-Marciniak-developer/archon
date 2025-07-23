import { useStackApp, useUser } from "@stackframe/react";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

const popFromLocalStorage = (key: string): string | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const value = localStorage.getItem(key);
    localStorage.removeItem(key);
    return value;
  }

  return null;
};


export const LoginRedirect = () => {
  const app = useStackApp()
  const user = useUser()
  const [isWaiting, setIsWaiting] = useState(true)

  const queryParams = new URLSearchParams(window.location.search);
  const next = queryParams.get('next') || popFromLocalStorage('dtbn-login-next')

  console.log('🔄 LoginRedirect: Current URL:', window.location.href);
  console.log('🔄 LoginRedirect: Current pathname:', window.location.pathname);
  console.log('🔄 LoginRedirect: Next parameter:', next);
  console.log('🔄 LoginRedirect: Query params:', queryParams.toString());
  console.log('🔄 LoginRedirect: User state:', user ? 'LOGGED IN' : 'NOT LOGGED IN');
  console.log('🔄 LoginRedirect: User details:', user);

  // Wait for user state to be loaded after OAuth
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsWaiting(false)
    }, 1000) // Wait 1 second for Stack Auth to set user state

    return () => clearTimeout(timer)
  }, [])

  // Show loading while waiting for user state
  if (isWaiting) {
    console.log('🔄 LoginRedirect: Waiting for user state...');
    return <div>Loading...</div>
  }

  // If we're on the problematic URL, force redirect to dashboard
  if (window.location.pathname === '/dashboard/auth/sign-in') {
    console.log('🔄 LoginRedirect: Fixing problematic URL, forcing redirect to dashboard');
    window.location.replace('/dashboard');
    return null;
  }

  // If user is not logged in yet after waiting, there might be an issue
  if (!user) {
    console.log('🔄 LoginRedirect: User not logged in after OAuth - Stack Auth issue!');
    console.log('🔄 LoginRedirect: Trying to manually check Stack Auth...');

    // Try to get user directly from Stack Auth
    stackClientApp.getUser().then(stackUser => {
      console.log('🔄 LoginRedirect: Direct Stack Auth user check:', stackUser);
    }).catch(err => {
      console.log('🔄 LoginRedirect: Direct Stack Auth error:', err);
    });

    // For now, redirect to sign-in to avoid infinite loop
    console.log('🔄 LoginRedirect: Redirecting to sign-in to break loop');
    return <Navigate to="/auth/sign-in" replace={true} />
  }

  if (next && next !== '/' && next !== '/dashboard') {
    console.log('🔄 LoginRedirect: User logged in, redirecting to next:', next);
    return <Navigate to={next} replace={true} />
  }

  // After successful login, redirect to dashboard
  console.log('🔄 LoginRedirect: User logged in, redirecting to dashboard');
  return <Navigate to="/dashboard" replace={true} />
};