import { APP_BASE_PATH } from '@/constants';
import { useStackApp, useUser, type CurrentInternalServerUser, type CurrentUser } from "@stackframe/react";
import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

type UserGuardContextType = {
  user: CurrentUser | CurrentInternalServerUser;
};

const UserGuardContext = createContext<UserGuardContextType | undefined>(
  undefined,
);

/**
 * Hook to access the logged in user from within a <UserGuard> component.
 */
export const useUserGuardContext = () => {
  const context = useContext(UserGuardContext);

  if (context === undefined) {
    throw new Error("useUserGuardContext must be used within a <UserGuard>");
  }

  return context;
};

const writeToLocalStorage = (key: string, value: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(key, value);
  }
};


export const UserGuard = (props: {
  children: React.ReactNode;
}) => {
  const app = useStackApp()
  const user = useUser()
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const { pathname } = useLocation();

  // Give Stack Auth time to load user state on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false)
    }, 500) // Wait 500ms for Stack Auth to initialize

    return () => clearTimeout(timer)
  }, [])

  // Debug logging (only when user state changes)
  useEffect(() => {
    if (!isInitialLoad) {
      console.log('🛡️ UserGuard: User state:', user ? 'LOGGED IN' : 'NOT LOGGED IN', 'on', pathname);
    }
  }, [user, isInitialLoad, pathname]);

  // Show loading during initial load
  if (isInitialLoad) {
    return <div>Loading...</div>
  }

  if (!user) {
    const queryParams = new URLSearchParams(window.location.search);

    // Don't set the next param if the user is logging out or on home page
    // to avoid ending up in an infinite redirect loop
    if (pathname !== app.urls.signOut && pathname !== '/' && pathname !== '/dashboard') {
      writeToLocalStorage('dtbn-login-next', pathname);
      queryParams.set("next", pathname);
    } else if (pathname === '/dashboard') {
      // For dashboard, don't set next param to avoid loops
      console.log('🛡️ UserGuard: Dashboard access without user, not setting next param');
    }

    const queryString = queryParams.toString();

    return <Navigate to={`${app.urls.signIn.replace(APP_BASE_PATH, '')}?${queryString}`} replace={true} />;
  }

  return (
    <UserGuardContext.Provider value={{ user }}>
      {props.children}
    </UserGuardContext.Provider>
  );
};
