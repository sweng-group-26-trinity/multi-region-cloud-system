import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGoogleLogin, useSignup } from "../api/authhooks";
import { useAuth } from "../context/AuthContext";

/**
 * Response returned by Google Identity Services after a successful sign-in.
 */
interface GoogleCredentialResponse {
  /** Google-issued ID token JWT */
  credential: string;
}

/**
 * Minimal type definition for the Google Identity Services object
 * injected onto the global window after loading the Google script.
 */
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
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
 * SignupPage component.
 *
 * Provides user registration functionality. Collects a username, first name,
 * last name, email address, and password. On successful registration the user
 * is redirected to `/dashboard`.
 *
 * Also provides Google sign-up/sign-in using Google Identity Services.
 *
 * Uses:
 * - {@link useSignup} for standard registration
 * - {@link useGoogleLogin} for Google OAuth registration/login via backend token exchange
 *
 * @returns The signup page JSX element.
 *
 * @example
 * <SignupPage />
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

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /**
   * Handles the signup form submission.
   *
   * Prevents the default browser form submission and calls the signup mutation
   * with the collected user details. Navigates to `/dashboard` on success.
   *
   * @param e - The React form submission event.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      { username, firstName, lastName, email, password },
      {
        onSuccess: (data) => {
          /**
           * Automatically authenticates the user after account creation
           * so protected routes can be accessed immediately.
           */
          login(data.accessToken);

          /**
           * Redirects the newly created user straight to the dashboard.
           */
          navigate("/dashboard");
        },
      },
    );
  };

  /**
   * Initializes the Google Identity Services sign-up/sign-in button once
   * the component mounts and the Google script is available on `window`.
   *
   * On successful Google authentication, the returned ID token is exchanged
   * with the backend for a normal application JWT.
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
      width: 398,
      logo_alignment: "left",
    });
  }, [googleLogin, login, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 bg-transparent">
      {/* 
        Signup form card.

        Dark mode support is added so the form remains readable when the global
        application theme switches to dark mode. The background and text colours
        adapt automatically using Tailwind's `dark:` variants.
      */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-center mb-2 text-slate-900 dark:text-white">
          Create your account
        </h1>

        <p className="text-gray-500 dark:text-slate-400 text-center mb-6">
          Join us and get started
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-200"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-200"
              >
                First name
              </label>

              <input
                id="firstName"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="lastName"
                className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-200"
              >
                Last name
              </label>

              <input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-200"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-200"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error.message}</p>}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700"
          >
            {isPending ? "Creating account…" : "Create account"}
          </Button>

          {/* 
            Divider between standard signup and Google signup.

            The background colour switches between white and dark mode card
            colour to ensure the divider text remains visible.
          */}
          <div className="relative text-center text-sm">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-slate-700" />
            </div>

            <span className="relative bg-white dark:bg-slate-900 px-2 text-muted-foreground dark:text-slate-400">
              OR
            </span>
          </div>

          {/* 
            Container for the official Google-rendered sign-up button.
            Google injects the actual button UI into this div.
          */}
          <div className="flex justify-center">
            <div ref={googleButtonRef} />
          </div>

          {googleError && (
            <p className="text-red-500 text-sm text-center">
              {googleError.message}
            </p>
          )}

          {isGooglePending && (
            <p className="text-sm text-center text-slate-500 dark:text-slate-400">
              Signing up with Google…
            </p>
          )}
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
