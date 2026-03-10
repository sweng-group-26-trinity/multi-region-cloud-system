/**
 * @file PublicRoute.tsx
 * @description Prevents authenticated users from accessing
 * public-only pages such as login and signup.
 * Redirects authenticated users to the dashboard.
 */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * PublicRoute checks whether a user is already authenticated.
 * If they are, it redirects them to the dashboard.
 * Otherwise, it renders the nested public route.
 *
 * @returns The public route content or a redirect to /dashboard.
 */
export default function PublicRoute() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
