/**
 * @file GoogleSignInButton.tsx
 * @description Renders a Google Sign-In button using Google Identity Services.
 * Handles authentication by exchanging the Google ID token with the backend
 * to obtain an application-specific JWT.
 */

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithGoogle } from "../api/auth";

/**
 * Props for the GoogleSignInButton component.
 */
type Props = {
  /**
   * Optional callback executed after a successful login.
   * Useful for triggering additional UI updates or state changes.
   */
  onSuccess?: () => void;
};

/**
 * GoogleSignInButton component.
 *
 * Initializes the Google Identity Services (GIS) button and handles
 * authentication flow:
 *
 * 1. Loads Google sign-in button into the DOM
 * 2. User authenticates via Google popup
 * 3. Receives Google ID token (`credential`)
 * 4. Sends token to backend (`/api/auth/google`)
 * 5. Backend validates token and returns JWT
 * 6. Stores JWT and user info in localStorage
 * 7. Redirects user to dashboard
 *
 * Requires:
 * - Google Identity Services script loaded in `index.html`
 * - `VITE_GOOGLE_CLIENT_ID` environment variable set
 *
 * @param props - Component props
 * @returns A div container where the Google button is rendered
 *
 * @example
 * <GoogleSignInButton onSuccess={() => console.log("Logged in")} />
 */
export default function GoogleSignInButton({ onSuccess }: Props) {
  /**
   * Reference to the container where Google will render the button.
   */
  const buttonRef = useRef<HTMLDivElement | null>(null);

  /**
   * React Router navigation hook for redirecting after login.
   */
  const navigate = useNavigate();

  useEffect(() => {
    /**
     * Google OAuth Client ID from environment variables.
     */
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    /**
     * Guard: Ensure client ID is available.
     */
    if (!clientId) {
      console.error("Missing VITE_GOOGLE_CLIENT_ID");
      return;
    }

    /**
     * Guard: Ensure Google script is loaded and DOM ref exists.
     */
    if (!window.google || !buttonRef.current) return;

    /**
     * Initialize Google Identity Services.
     */
    window.google.accounts.id.initialize({
      client_id: clientId,

      /**
       * Callback executed after successful Google authentication.
       *
       * @param response - Contains the Google ID token (`credential`)
       */
      callback: async (response: { credential?: string }) => {
        try {
          /**
           * Ensure credential exists.
           */
          if (!response.credential) {
            throw new Error("No Google credential returned");
          }

          /**
           * Send ID token to backend to exchange for JWT.
           */
          const data = await loginWithGoogle({
            idToken: response.credential,
          });

          /**
           * Persist authentication data locally.
           */
          localStorage.setItem("token", data.accessToken);
          localStorage.setItem("user", JSON.stringify(data.user));

          /**
           * Optional success callback.
           */
          onSuccess?.();

          /**
           * Redirect user to dashboard after login.
           */
          navigate("/dashboard");
        } catch (error) {
          /**
           * Handle authentication failure.
           */
          console.error("Google sign-in failed:", error);
          alert("Google sign-in failed");
        }
      },
    });

    /**
     * Clear any existing button before rendering.
     */
    buttonRef.current.innerHTML = "";

    /**
     * Render Google Sign-In button.
     */
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: 260,
    });
  }, [navigate, onSuccess]);

  /**
   * Container div for the Google button.
   */
  return <div ref={buttonRef} />;
}
