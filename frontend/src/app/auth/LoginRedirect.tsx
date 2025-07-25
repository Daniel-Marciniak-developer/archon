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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsWaiting(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isWaiting) {
    return <div>Loading...</div>
  }

  if (window.location.pathname === '/dashboard/auth/sign-in') {
    window.location.replace('/dashboard');
    return null;
  }

  if (!user) {
    return <Navigate to="/auth/sign-in" replace={true} />
  }

  if (next && next !== '/' && next !== '/dashboard') {
    return <Navigate to={next} replace={true} />
  }

  return <Navigate to="/dashboard" replace={true} />
};

