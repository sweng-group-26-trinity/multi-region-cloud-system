import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLogin, useGoogleLogin } from "../api/authhooks";
import { useAuth } from "../context/AuthContext";

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
 * Response returned by Google Identity Services after a successful sign-in.
 */
interface GoogleCredentialResponse {
  /** Google-issued ID token JWT */
  credential: string;
}

/**
 * LoginPage component.
 *
 * Renders a card-style login form accepting either an email address or username
 * alongside a password. On successful authentication the user is redirected to
 * `/dashboard`. Also provides a Google SSO option and a link to `/signup`.
 *
 * Uses:
 * - {@link useLogin} for standard email/username login
 * - {@link useGoogleLogin} for Google OAuth login via backend token exchange
 *
 * @returns The login page JSX element.
 *
 * @example
 * <LoginPage />
 */
export function LoginPage() {
  const { mutate, isPending, error } = useLogin();
  const {
    mutate: googleLogin,
    isPending: isGooglePending,
    error: googleError,
  } = useGoogleLogin();

  const { login } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  /**
   * Handles the standard login form submission.
   *
   * Prevents the default browser form submission and calls the login mutation
   * with the current identifier and password. Navigates to `/dashboard` on success.
   *
   * @param e - The React form submission event.
   */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutate(
      { identifier, password },
      {
        onSuccess: (data) => {
          login(data.accessToken);
          navigate("/dashboard");
        },
      },
    );
  };

  /**
   * Initializes the Google Identity Services sign-in button once the component
   * mounts and the Google script is available on `window`.
   *
   * On successful Google authentication, the returned ID token is exchanged
   * with the backend for a normal application JWT.
   */
  useEffect(() => {
    if (!window.google || !googleButtonRef.current) return;

    const clientId =
      import.meta.env?.VITE_GOOGLE_CLIENT_ID ??
      "625744063797-sg9hkugo999aqivfpgjai87418662n0e.apps.googleusercontent.com";

    if (!clientId) {
      console.error("Missing VITE_GOOGLE_CLIENT_ID");
      return;
    }

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
      text: "signin_with",
      shape: "rectangular",
      width: "100%",
      logo_alignment: "left",
    });
  }, [googleLogin, login, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 overflow-y-auto bg-transparent">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-6 pb-8 shadow-lg transition-all duration-300 hover:shadow-xl dark:bg-slate-900 dark:shadow-black/30">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Sign in to your account
          </h1>
          <p className="text-sm text-muted-foreground dark:text-slate-400">
            Welcome back
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label
              htmlFor="identifier"
              className="text-slate-900 dark:text-slate-200"
            >
              Email or username
            </Label>
            <input
              id="identifier"
              type="text"
              placeholder="Email or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-slate-900 dark:text-slate-200"
              >
                Password
              </Label>
              <Link
                to="/forgot-password"
                className="text-sm text-indigo-600 transition-colors duration-200 hover:underline dark:text-indigo-400"
              >
                Forgot password?
              </Link>
            </div>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error.message}</p>}

          <Button
            type="submit"
            disabled={isPending}
            className="h-11 w-full bg-indigo-600 transition-all duration-200 hover:scale-[1.02] hover:bg-indigo-700 hover:shadow-md"
          >
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="relative mt-6 text-center text-sm">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-300 dark:border-slate-700" />
          </div>
          <span className="relative bg-white px-2 text-muted-foreground dark:bg-slate-900 dark:text-slate-400">
            OR
          </span>
        </div>

        <div className="w-full flex justify-center">
          <div className="w-full max-w-[320px]" ref={googleButtonRef} />
        </div>

        {googleError && (
          <p className="text-sm text-center text-red-500">
            {googleError.message}
          </p>
        )}

        {isGooglePending && (
          <p className="text-sm text-center text-slate-500 dark:text-slate-400">
            Signing in with Google…
          </p>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground dark:text-slate-400">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-indigo-600 transition-colors duration-200 hover:underline dark:text-indigo-400"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
