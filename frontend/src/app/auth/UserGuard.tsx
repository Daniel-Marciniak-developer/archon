import { APP_BASE_PATH } from '@/constants';
import { useStackApp, useUser, type CurrentInternalServerUser, type CurrentUser } from "@stackframe/react";
import * as React from "react";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";

type UserGuardContextType = {
  user: CurrentUser | CurrentInternalServerUser;
};

const UserGuardContext = createContext<UserGuardContextType | undefined>(
  undefined,
);


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
  const rawUser = useUser()
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const user = useMemo(() => rawUser, [rawUser?.id || null]);

  const { pathname } = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (isInitialLoad) {
    return <div>Loading...</div>
  }

  if (!user) {
    const queryParams = new URLSearchParams(window.location.search);

    if (pathname !== app.urls.signOut && pathname !== '/' && pathname !== '/dashboard') {
      writeToLocalStorage('dtbn-login-next', pathname);
      queryParams.set("next", pathname);
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

