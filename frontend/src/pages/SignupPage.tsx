import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSignup } from "../api/authhooks";

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
      { onSuccess: () => navigate("/dashboard") },
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-center mb-2">
          Create your account
        </h1>
        <p className="text-gray-500 text-center mb-6">
          Join us and get started
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-1"
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
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium mb-1"
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
                className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="lastName"
                className="block text-sm font-medium mb-1"
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
                className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
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
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <div className="relative text-center text-sm">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <span className="relative bg-white px-2 text-muted-foreground">
              OR
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-3 h-11"
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
