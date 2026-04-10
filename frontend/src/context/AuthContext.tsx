/**
 * @file AuthContext.tsx
 * @description Provides global authentication state and helper functions
 * for logging in and logging out across the application.
 */
import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * Shape of the authenticated user.
 */
export type User = {
  /** Authenticated user's username */
  username: string;
  /** Authenticated user's email address */
  email: string;
};

/**
 * Shape of the authentication context.
 */
export type AuthContextType = {
  /** Indicates whether the user is currently authenticated. */
  isAuthenticated: boolean;
  /** The currently authenticated user, or null if not logged in. */
  user: User | null;
  /**
   * Logs the user in.
   * @param token Authentication token returned by the backend.
   * @param user  User info returned by the backend.
   */
  login: (token: string, user: User) => void;
  /** Logs the user out and clears authentication state. */
  logout: () => void;
};

/**
 * React context used to share authentication state across the app.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider wraps the app and provides authentication state
 * and actions to all child components.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem("authToken");
  });

  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  /**
   * Logs the user in by saving their token and user info,
   * then updating auth state.
   *
   * @param token The authentication token to store.
   * @param user  The authenticated user's info to store.
   */
  const login = (token: string, user: User) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(user));
    setIsAuthenticated(true);
    setUser(user);
  };

  /**
   * Logs the user out by removing their token and clearing auth state.
   */
  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook for accessing authentication context.
 *
 * @returns The current authentication context.
 * @throws Error if used outside of an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
