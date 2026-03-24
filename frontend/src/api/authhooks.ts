import { useMutation } from "@tanstack/react-query";
import {
  login,
  loginWithGoogle,
  signup,
  type LoginRequest,
  type SignupRequest,
  type GoogleLoginRequest,
  type AuthResponse,
} from "./auth";

/**
 * React Query hook for standard user login.
 *
 * Sends the provided identifier and password to the backend and stores
 * the returned JWT access token in local storage on success.
 *
 * @returns Mutation for email/username login.
 *
 * @example
 * const { mutate, isPending, error } = useLogin();
 * mutate({ identifier: "alice", password: "secret" });
 */
export function useLogin() {
  return useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem("token", data.accessToken);
    },
  });
}

/**
 * React Query hook for user registration.
 *
 * Sends registration details to the backend and stores the returned JWT
 * access token in local storage on success.
 *
 * @returns Mutation for signup.
 *
 * @example
 * const { mutate, isPending, error } = useSignup();
 * mutate({
 *   username: "john",
 *   firstName: "John",
 *   lastName: "Doe",
 *   email: "john@example.com",
 *   password: "secret",
 * });
 */
export function useSignup() {
  return useMutation<AuthResponse, Error, SignupRequest>({
    mutationFn: signup,
    onSuccess: (data) => {
      localStorage.setItem("token", data.accessToken);
    },
  });
}

/**
 * React Query hook for Google OAuth login.
 *
 * Exchanges a Google ID token with the backend for a normal application JWT.
 *
 * @returns Mutation for Google sign-in.
 *
 * @example
 * const { mutate } = useGoogleLogin();
 * mutate({ idToken: googleCredential });
 */
export function useGoogleLogin() {
  return useMutation<AuthResponse, Error, GoogleLoginRequest>({
    mutationFn: loginWithGoogle,
    onSuccess: (data) => {
      localStorage.setItem("token", data.accessToken);
    },
  });
}
