/**
 * @file SignupPage.tsx
 * @description Renders the user signup page with support for both
 * standard account creation and Google-based signup/login.
 */

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGoogleLogin, useSignup } from "../api/authhooks";
import { useAuth } from "../context/AuthContext";

/**
 * Response returned by Google Identity Services after a successful
 * credential selection.
 */
interface GoogleCredentialResponse {
  /** Google ID token credential. */
  credential: string;
}

declare global {
  /**
   * Extends the browser window object with the Google Identity Services API.
   */
  interface Window {
    google?: {
      accounts: {
        id: {
          /**
           * Initialises the Google sign-in client.
           *
           * @param config - Google client configuration including client ID
           * and callback handler.
           */
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;

          /**
           * Renders the Google sign-in button into a target DOM element.
           *
           * @param parent - The DOM element that will contain the button.
           * @param options - Button display and layout options.
           */
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: string | number;
              logo_alignment?: "left" | "center";
            },
          ) => void;
        };
      };
    };
  }
}

/**
 * Signup page component.
 *
 * Displays a registration form for creating a new account and provides
 * an alternative Google signup flow. On successful authentication,
 * the user is logged in and redirected to the dashboard.
 *
 * @returns The rendered signup page.
 */
export function SignupPage() {
  const { mutate, isPending, error } = useSignup();
  const {
    mutate: googleLogin,
    isPending: isGooglePending,
    error: googleError,
  } = useGoogleLogin();

  const navigate = useNavigate();
  const { login } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  /** Username entered by the user. */
  const [username, setUsername] = useState("");

  /** First name entered by the user. */
  const [firstName, setFirstName] = useState("");

  /** Last name entered by the user. */
  const [lastName, setLastName] = useState("");

  /** Email address entered by the user. */
  const [email, setEmail] = useState("");

  /** Password entered by the user. */
  const [password, setPassword] = useState("");

  /**
   * Handles form submission for standard account creation.
   *
   * Prevents the default browser form submission behaviour, sends the
   * entered signup data to the signup mutation, and logs the user in
   * on success before redirecting to the dashboard.
   *
   * @param e - The submitted React form event.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      { username, firstName, lastName, email, password },
      {
        onSuccess: (data) => {
          login(data.accessToken);
          navigate("/dashboard");
        },
      },
    );
  };

  /**
   * Initialises and renders the Google signup button once the Google
   * Identity Services API and target container are available.
   *
   * On successful Google authentication, the returned credential is sent
   * to the backend Google login handler, after which the user is logged in
   * and redirected to the dashboard.
   */
  useEffect(() => {
    if (!googleButtonRef.current || !window.google) return;

    const clientId =
      import.meta.env?.VITE_GOOGLE_CLIENT_ID ??
      "625744063797-sg9hkugo999aqivfpgjai87418662n0e.apps.googleusercontent.com";

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: GoogleCredentialResponse) => {
        googleLogin(
          { idToken: response.credential },
          {
            onSuccess: (data) => {
              login(data.accessToken);
              navigate("/dashboard");
            },
          },
        );
      },
    });

    googleButtonRef.current.innerHTML = "";

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      text: "signup_with",
      shape: "rectangular",
      width: "100%",
      logo_alignment: "left",
    });
  }, [googleLogin, login, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 pb-8 shadow-2xl transition-all duration-300 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-center mb-2 text-slate-900 dark:text-white">
          Create your account
        </h1>

        <p className="text-gray-500 dark:text-slate-400 text-center mb-6">
          Join us and get started
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-200">
              Username
            </label>
            <input
              type="text"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Names */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-2 dark:bg-slate-800 dark:border-slate-700"
            />
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-2 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          {/* Email */}
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2 dark:bg-slate-800 dark:border-slate-700"
          />

          {/* Password */}
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2 dark:bg-slate-800 dark:border-slate-700"
          />

          {error && <p className="text-red-500 text-sm">{error.message}</p>}

          <Button
            type="submit"
            disabled={isPending}
            className="h-11 w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {isPending ? "Creating account…" : "Create account"}
          </Button>

          {/* Divider */}
          <div className="relative text-center text-sm my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t dark:border-slate-700" />
            </div>
            <span className="relative bg-white dark:bg-slate-900 px-2">OR</span>
          </div>

          {/* Google button */}
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[320px]" ref={googleButtonRef} />
          </div>

          {googleError && (
            <p className="text-red-500 text-sm text-center">
              {googleError.message}
            </p>
          )}

          {isGooglePending && (
            <p className="text-sm text-center text-slate-500">
              Signing up with Google…
            </p>
          )}
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}