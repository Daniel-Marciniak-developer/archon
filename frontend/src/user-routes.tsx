
import { lazy } from "react";
import { RouteObject } from "react-router";


import { UserGuard } from "app";


import { StackHandlerRoutes, LoginRedirect } from "app/auth";


const App = lazy(() => import("./pages/App.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const ProjectReport = lazy(() => import("./pages/ProjectReport.tsx"));
const RepositoryViewerPage = lazy(() => import("./pages/RepositoryViewerPage.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const GitHubCallback = lazy(() => import("./pages/GitHubCallback.tsx"));

export const userRoutes: RouteObject[] = [
	{ path: "/auth/*", element: <StackHandlerRoutes />},
	{ path: "/auth/callback/github", element: <GitHubCallback />},
	{ path: "/", element: <App />},
	{ path: "/dashboard", element: <UserGuard><Dashboard /></UserGuard>},
	{ path: "/project-report", element: <UserGuard><ProjectReport /></UserGuard>},
	{ path: "/projectreport", element: <UserGuard><ProjectReport /></UserGuard>},
	{ path: "/projects/:id/report", element: <UserGuard><ProjectReport /></UserGuard>},
	{ path: "/projects/:projectId/repository", element: <UserGuard><RepositoryViewerPage /></UserGuard>},
	{ path: "/settings", element: <UserGuard><Settings /></UserGuard>},
];

