import { apiFetch } from "./clients";

/**
 * Request payload for user login.
 */
export interface LoginRequest {
  /** Username or email address */
  identifier: string;
  /** User password */
  password: string;
}

/**
 * Request payload for user registration.
 */
export interface SignupRequest {
  /** Unique username */
  username: string;
  /** User first name */
  firstName: string;
  /** User last name */
  lastName: string;
  /** User email address */
  email: string;
  /** User password */
  password: string;
}

/**
 * Request payload for Google OAuth login.
 */
export interface GoogleLoginRequest 
{
  /**
   * Google ID token returned from Google Identity Services.
   * This is a JWT issued by Google after successful authentication.
   */
  idToken: string;
}

/**
 * Response returned after successful authentication.
 */
export interface AuthResponse {
  /** JWT access token */
  accessToken: string;
  /** Token type, typically "Bearer" */
  tokenType: string;
  /** Token expiration time in seconds */
  expiresIn: number;
  /** Authenticated user details */
  user: {
    /** User ID */
    id: string;
    /** Username */
    username: string;
    /** User email address */
    email: string;
  };
}

/**
 * Sends a login request to the backend authentication endpoint.
 *
 * @param data - Login credentials containing an identifier (email or username) and password
 * @returns AuthResponse containing the JWT access token and user data
 */
export const login = (data: LoginRequest) =>
  apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

/**
 * Sends a signup request to the backend authentication endpoint.
 *
 * @param data - Registration information including username, name, email, and password
 * @returns AuthResponse containing the JWT access token and user data
 */
export const signup = (data: SignupRequest) =>
  apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

/**
 * Sends a Google OAuth login request to the backend.
 *
 * This endpoint exchanges a Google-issued ID token for a JWT issued
 * by your backend. The backend validates the token with Google and
 * returns the same AuthResponse as a normal login.
 *
 * @param data - Object containing the Google ID token
 * @returns AuthResponse containing the JWT access token and user data
 */
export const loginWithGoogle = (data: GoogleLoginRequest) =>
  apiFetch<AuthResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify(data),
  });
