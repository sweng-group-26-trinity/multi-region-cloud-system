import { useEffect, useState, type ReactNode } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import { RestaurantsPage } from "./pages/RestaurantPage";
import OrdersPage from "./pages/OrdersPage";
import DatabaseHealth from "./pages/DatabaseHealth";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import {
  Moon,
  Sun,
  UtensilsCrossed,
  HeartPulse,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import "./index.css";

/**
 * Defines all animated application routes.
 *
 * Public routes:
 * - /
 * - /login
 * - /signup
 * - /forgot-password
 * - /health
 *
 * Protected routes:
 * - /dashboard
 * - /menu/:id
 *
 * @returns Animated route tree for the application.
 */
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <Page>
              <HomePage />
            </Page>
          }
        />

        {/* Public-only routes */}
        <Route element={<PublicRoute />}>
          <Route
            path="/login"
            element={
              <Page>
                <LoginPage />
              </Page>
            }
          />
          <Route
            path="/signup"
            element={
              <Page>
                <SignupPage />
              </Page>
            }
          />
        </Route>

        <Route
          path="/forgot-password"
          element={
            <Page>
              <ForgotPasswordPage />
            </Page>
          }
        />

        <Route
          path="/health"
          element={
            <Page>
              <DatabaseHealth />
            </Page>
          }
        />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={
              <Page>
                <RestaurantsPage />
              </Page>
            }
          />
          <Route
            path="/menu/:id"
            element={
              <Page>
                <OrdersPage />
              </Page>
            }
          />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

/**
 * Wraps each page in a small transition animation for smoother route changes.
 *
 * @param props.children - Page content to animate.
 * @returns Animated page container.
 */
function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="min-h-[calc(100vh-140px)]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Application header component.
 *
 * Behaviour:
 * - Always shows the brand logo and dark mode toggle
 * - Only shows Dashboard / Health / Logout on protected-style pages
 * - Keeps the header simple on home, login, signup, and forgot-password pages
 *
 * @param props.darkMode - Current dark mode state.
 * @param props.toggleDarkMode - Function to toggle dark mode on or off.
 * @returns Top navigation header.
 */
function Header({
  darkMode,
  toggleDarkMode,
}: {
  darkMode: boolean;
  toggleDarkMode: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  /** Token used to determine whether the user is authenticated. */
  const token = localStorage.getItem("token");

  /**
   * Pages where the header should remain minimal.
   * On these pages, only the dark mode button is shown on the right.
   */
  const isSimpleHeaderPage =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/forgot-password";

  /**
   * Determines whether authenticated navigation buttons should be shown.
   */
  const showPrivateButtons = !isSimpleHeaderPage && !!token;

  /**
   * Logs the user out, clears the stored token, and redirects to the login page.
   */
  const handleLogout = () => {
    localStorage.removeItem("token");
    logout();
    navigate("/login");
  };

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200
                 bg-white/90 px-6 py-4 backdrop-blur transition-colors duration-300
                 dark:border-slate-800 dark:bg-slate-950/90"
    >
      {/* Brand / logo section */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-200
                   hover:scale-[1.02] hover:bg-slate-100 dark:hover:bg-slate-900"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
          <UtensilsCrossed size={18} strokeWidth={2.5} />
        </div>
        <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          DineHub
        </span>
      </button>

      {/* Header actions */}
      <div className="flex items-center gap-3">
        {/* Dark mode toggle is always visible */}
        <button
          type="button"
          onClick={toggleDarkMode}
          title={darkMode ? "Light Mode" : "Dark Mode"}
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-slate-900 shadow-md
                     transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]
                     dark:bg-slate-900 dark:text-slate-100 dark:shadow-black/30"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span className="hidden font-medium sm:inline">
            {darkMode ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        {/* Authenticated navigation actions */}
        {showPrivateButtons && (
          <>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              title="Dashboard"
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-slate-900 shadow-md
                         transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]
                         dark:bg-slate-900 dark:text-slate-100 dark:shadow-black/30"
            >
              <LayoutDashboard size={18} />
              <span className="hidden font-medium sm:inline">Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/health")}
              title="Health"
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-slate-900 shadow-md
                         transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]
                         dark:bg-slate-900 dark:text-slate-100 dark:shadow-black/30"
            >
              <HeartPulse size={18} />
              <span className="hidden font-medium sm:inline">Health</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-slate-900 shadow-md
                         transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]
                         dark:bg-slate-900 dark:text-slate-100 dark:shadow-black/30"
            >
              <LogOut size={18} />
              <span className="hidden font-medium sm:inline">Logout</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}

/**
 * Global footer displayed at the bottom of the app.
 *
 * @returns Footer with current year and branding.
 */
function Footer() {
  return (
    <footer
      className="border-t border-slate-200 bg-white px-6 py-4 text-center text-sm text-slate-600
                 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
    >
      © {new Date().getFullYear()} DineHub
    </footer>
  );
}

/**
 * Main application shell.
 *
 * Responsibilities:
 * - Loads and persists dark mode state
 * - Applies dark mode classes to the document root
 * - Renders shared layout sections: Header, main content, and Footer
 *
 * @returns Main app layout wrapper.
 */
function AppShell() {
  /** Tracks whether dark mode is enabled. */
  const [darkMode, setDarkMode] = useState(false);

  /**
   * Loads the user's saved dark mode preference from localStorage
   * when the app first mounts.
   */
  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    const isDark = savedMode === "true";

    setDarkMode(isDark);

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  /**
   * Toggles dark mode on and off and persists the new preference.
   */
  function toggleDarkMode() {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));

    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  return (
    <div className="min-h-screen w-screen bg-white transition-colors duration-300 dark:bg-slate-950">
      <div className="flex min-h-screen flex-col">
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <main className="flex-1">
          <AnimatedRoutes />
        </main>
        <Footer />
      </div>
    </div>
  );
}

/**
 * Root application component.
 *
 * @returns The complete app shell.
 */
export function App() {
  return <AppShell />;
}

export default App;
