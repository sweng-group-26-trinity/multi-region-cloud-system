/**
 * @file AuthContext.tsx
 * @description Provides global authentication state and helper functions
 * for logging in and logging out across the application.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
/**
 * Shape of the authentication context.
 */
export type AuthContextType = {
  /** Indicates whether the user is currently authenticated. */
  isAuthenticated: boolean;

  /**
   * Logs the user in.
   * @param token Authentication token returned by the backend.
   */
  login: (token: string) => void;

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  /**
   * On initial load, check localStorage for an auth token
   * and restore the authentication state if one exists.
   */
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsAuthenticated(!!token);
  }, []);

  /**
   * Logs the user in by saving their token and updating auth state.
   *
   * @param token The authentication token to store.
   */
  const login = (token: string) => {
    localStorage.setItem("authToken", token);
    setIsAuthenticated(true);
  };

  /**
   * Logs the user out by removing their token and clearing auth state.
   */
  const logout = () => {
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
