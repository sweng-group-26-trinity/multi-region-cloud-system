import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/**
 * ForgotPasswordPage component.
 *
 * Allows users to request a password reset.
 * Users can submit their email address
 * to receive reset instructions.
 *
 * This page integrates with the backend
 * password recovery endpoint.
 */
export function ForgotPasswordPage() {
  return (
    <div className="w-full flex justify-center px-4 pt-16 min-h-screen">
      {/* 
        Password reset card.

        Dark mode support is added so the form remains readable when the
        application theme switches to dark mode. The card background,
        text colours, and borders adapt automatically.
      */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-lg dark:shadow-black/30 p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Reset your password
          </h1>

          <p className="text-sm text-muted-foreground dark:text-slate-400">
            Enter your email to receive a reset link.
          </p>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-900 dark:text-slate-200">Email</Label>

            {/* 
              Email input field.

              Dark mode styles ensure the input background, text,
              placeholder, and border remain visible on dark themes.
            */}
            <input
              type="email"
              className="w-full h-11 px-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700">
            Send reset link
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground dark:text-slate-400">
          Back to{" "}
          <Link
            to="/login"
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            login
          </Link>
        </p>
      </div>
    </div>
  );
}
