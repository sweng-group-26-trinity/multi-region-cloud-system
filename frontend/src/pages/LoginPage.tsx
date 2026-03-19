import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/**
 * LoginPage component.
 *
 * Renders the user login form.
 * Allows users to:
 * - Enter email and password
 * - Navigate to forgot password page
 * - Authenticate using Google
 *
 * This component connects to backend authentication
 * through the login API hook.
 */
export function LoginPage() {
  return (
    <div className="w-full flex justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6 transition-all duration-300 hover:shadow-2xl">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Sign in to your account</h1>
          <p className="text-sm text-muted-foreground">Welcome back 👋</p>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full h-11 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Password</Label>
              <Link
                to="/forgot-password"
                className="text-sm text-indigo-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <input
              type="password"
              placeholder="Enter your password"
              className="w-full h-11 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 hover:scale-[1.02]">
            Sign in
          </Button>
        </form>

        <div className="relative text-center text-sm">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <span className="relative bg-white px-2 text-muted-foreground">
            OR
          </span>
        </div>

        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-3 h-11 transition-all duration-300 hover:scale-[1.02] hover:shadow-md hover:bg-gray-50"
        >
          {/* Google SVG */}
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
          Sign in with Google
        </Button>

        <p className="text-sm text-center text-muted-foreground">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-indigo-600 hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
