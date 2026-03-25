import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSignup } from "../api/authhooks";
import { useAuth } from "../context/AuthContext";

/**
 * SignupPage component.
 *
 * Provides user registration functionality. Collects a username, first name,
 * last name, email address, and password. On successful registration the user
 * is redirected to `/restaurants`.
 *
 * Uses the {@link useSignup} hook to communicate with the backend authentication service.
 *
 * @returns The signup page JSX element.
 *
 * @example
 * // Typically mounted by the router, no props required.
 * <SignupPage />
 */
export function SignupPage() {
  const { mutate, isPending, error } = useSignup();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /**
   * Handles the signup form submission.
   *
   * Prevents the default browser form submission and calls the signup mutation
   * with the collected user details. Navigates to `/restaurants` on success.
   *
   * @param e - The React form submission event.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      { username, firstName, lastName, email, password },
      {
        onSuccess: () => {
          /**
           * Automatically authenticates the user after account creation
           * so protected routes can be accessed immediately.
           */
          login("loggedIn");

          /**
           * Redirects the newly created user straight to the dashboard.
           */
          navigate("/dashboard");
        },
      },
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 bg-transparent">
      {/* 
        Signup form card.

        Dark mode support is added so the form remains readable when the global
        application theme switches to dark mode. The background and text colours
        adapt automatically using Tailwind's `dark:` variants.
      */}
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl transition-all duration-300 hover:shadow-xl dark:bg-slate-900">
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
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
            className="h-11 w-full bg-indigo-600 transition-all duration-200 hover:scale-[1.02] hover:bg-indigo-700 hover:shadow-md"
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

          <Button
            type="button"
            variant="outline"
            className="flex h-11 w-full items-center justify-center gap-3 border-gray-300 bg-white text-slate-900 transition-all duration-200 hover:scale-[1.02] hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="w-5 h-5"
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
            Sign up with Google
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-600 transition-colors duration-200 hover:underline dark:text-indigo-400"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
