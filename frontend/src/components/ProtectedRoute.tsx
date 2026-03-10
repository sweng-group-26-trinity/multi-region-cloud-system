/**
 * @file ProtectedRoute.tsx
 * @description Restricts access to authenticated users only.
 * Redirects unauthenticated users to the login page.
 */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute checks whether a user is authenticated.
 * If they are, it renders the nested route.
 * Otherwise, it redirects them to the login page.
 *
 * @returns The protected route content or a redirect to /login.
 */
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
