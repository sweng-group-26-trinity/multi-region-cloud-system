import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLogin } from "../api/authhooks";
import { useAuth } from "../context/AuthContext";

/**
 * LoginPage component.
 *
 * Renders a card-style login form accepting either an email address or username
 * alongside a password. On successful authentication the user is redirected to
 * `/dashboard`. Also provides a Google SSO button and a link to `/signup`.
 *
 * Uses the {@link useLogin} hook to communicate with the backend authentication service.
 *
 * @returns The login page JSX element.
 *
 * @example
 * // Typically mounted by the router, no props required.
 * <LoginPage />
 */
export function LoginPage() {
  const { mutate, isPending, error } = useLogin();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  /**
   * Handles the login form submission.
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
        onSuccess: () => {
          login("loggedIn");
          navigate("/dashboard");
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 bg-transparent">
      {/* 
        Main login card.
        Dark mode support is added here so the card remains readable
        against the darker global page background.
      */}
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl dark:bg-slate-900 dark:shadow-black/30">
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

        {/* 
          Divider between standard login and Google sign-in.
          Background text chip is dark-mode aware so it blends with the card correctly.
        */}
        <div className="relative mt-6 text-center text-sm">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-300 dark:border-slate-700" />
          </div>
          <span className="relative bg-white px-2 text-muted-foreground dark:bg-slate-900 dark:text-slate-400">
            OR
          </span>
        </div>

        <Button
          variant="outline"
          className="mt-6 flex h-11 w-full items-center justify-center gap-3 border-slate-300 bg-white text-slate-900 transition-all duration-200 hover:scale-[1.02] hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="h-5 w-5"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.15 0 5.97 1.08 8.2 3.2l6.1-6.1C34.2 2.5 29.5 0 24 0 14.6 0 6.5 5.5 2.6 13.5l7.5 5.8C12 13.2 17.5 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.1 24.5c0-1.7-.15-3.3-.45-4.9H24v9.3h12.4c-.5 2.7-2 5-4.3 6.6l6.6 5.1c3.9-3.6 6.4-9 6.4-15.1z"
            />
            <path
              fill="#FBBC05"
              d="M10.1 28.3c-.6-1.7-.9-3.5-.9-5.3s.3-3.6.9-5.3l-7.5-5.8C1 15.4 0 19.6 0 24s1 8.6 2.6 12.1l7.5-5.8z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.5 0 12-2.1 16-5.7l-6.6-5.1c-2 1.4-4.6 2.3-9.4 2.3-6.5 0-12-3.7-14.9-9l-7.5 5.8C6.5 42.5 14.6 48 24 48z"
            />
          </svg>
          Sign in with Google
        </Button>

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
