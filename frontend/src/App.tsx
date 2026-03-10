import { useEffect, useState, type ReactNode } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
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
import { Moon, Sun, UtensilsCrossed, HeartPulse } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import "./index.css";

/**
 * Animated route wrapper
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
 * Page animation wrapper
 */
function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="min-h-screen"
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
 * App shell with branding + dark mode toggle
 */
function AppShell() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

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
    <div className="relative min-h-screen w-screen bg-white transition-colors duration-300 dark:bg-slate-950">
      {/* Brand Logo */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 rounded-xl px-4 py-2
                   bg-white text-slate-900 shadow-md transition-all duration-200
                   hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]
                   dark:bg-slate-900 dark:text-slate-100 dark:shadow-black/30"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
          <UtensilsCrossed size={18} strokeWidth={2.5} />
        </div>
        <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          DineHub
        </span>
      </button>

      {/* Dark mode toggle */}
      <button
        type="button"
        onClick={toggleDarkMode}
        className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-2
                   bg-white text-slate-900 shadow-md transition-all duration-200
                   hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]
                   dark:bg-slate-900 dark:text-slate-100 dark:shadow-black/30"
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        <span className="font-medium text-slate-900 dark:text-slate-100">
          {darkMode ? "Light Mode" : "Dark Mode"}
        </span>
      </button>

      <button
        type="button"
        onClick={() => navigate("/health")}
        className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-2
                  bg-white text-slate-900 shadow-md transition-all duration-200
                  hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]
                  dark:bg-slate-900 dark:text-slate-100 dark:shadow-black/30"
      >
        <HeartPulse size={18} />
        <span className="font-medium text-slate-900 dark:text-slate-100">
          Health
        </span>
      </button>

      <button
        type="button"
        onClick={() => {
          logout();
          navigate("/login");
        }}
        className="fixed top-190 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-2
                  bg-white text-slate-900 shadow-md transition-all duration-200
                  hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]
                  dark:bg-slate-900 dark:text-slate-100 dark:shadow-black/30"
      >
        Logout
      </button>

      <AnimatedRoutes />
    </div>
  );
}

/**
 * Root App
 */
export function App() {
  return <AppShell />;
}

export default App;
