import { useEffect, useState, type ReactNode } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import { RestaurantsPage } from "./pages/RestaurantPage";
import OrdersPage from "./pages/OrdersPage";
import OrderSummaryPage from "./pages/OrderSummaryPage";
import DatabaseHealth from "./pages/DatabaseHealth";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import FAQPage from "./pages/FAQPage";
import {
  Moon,
  Sun,
  UtensilsCrossed,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import "./index.css";
import PlaneBird from "./pages/PlaneBird";

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

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
          path="/game"
          element={
            <Page>
              <PlaneBird />
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
        <Route
          path="/faq"
          element={
            <Page>
              <FAQPage />
            </Page>
          }
        />

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
          <Route
            path="/order-summary"
            element={
              <Page>
                <OrderSummaryPage />
              </Page>
            }
          />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

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

function Header({
  darkMode,
  toggleDarkMode,
}: {
  darkMode: boolean;
  toggleDarkMode: () => void;
}) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const token = localStorage.getItem("token");

  const pathname = location.pathname;

  const isHomePage = pathname === "/";
  const isHealthPage = pathname === "/health";
  const isSimpleHeaderPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password";

  const isDashboardPage = pathname === "/dashboard";

  const showPrivateButtons = !isSimpleHeaderPage && !!token;

  const handleLogout = () => {
    localStorage.removeItem("token");
    logout();
    navigate("/login");
  };

  const navIconClass =
    "h-[42px] w-[42px] rounded-full flex items-center justify-center text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-orange-500 active:scale-[0.97] dark:text-slate-200 dark:hover:bg-slate-900";

  const navTextClass =
    "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-orange-500 active:scale-[0.97] dark:text-slate-200 dark:hover:bg-slate-900";

  const logoutClass =
    "flex items-center gap-2 rounded-full bg-orange-500 px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-orange-600 active:scale-[0.97]";

  if (isHomePage) {
    return (
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-50">
        <div className="pointer-events-auto flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 rounded-xl px-2 py-2 transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
              <UtensilsCrossed size={18} strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold text-white drop-shadow">
              DineHub
            </span>
          </button>

          <button
            type="button"
            onClick={toggleDarkMode}
            title={darkMode ? "Light Mode" : "Dark Mode"}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full text-white transition-all duration-200 hover:bg-white/10 active:scale-[0.97]"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    );
  }

  if (isHealthPage) {
    return (
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-50">
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex shrink-0 items-center gap-2 rounded-xl px-2 py-2 transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
              <UtensilsCrossed size={18} strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              DineHub
            </span>
          </button>

          <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggleDarkMode}
              title={darkMode ? "Light Mode" : "Dark Mode"}
              className="flex h-[42px] w-[42px] items-center justify-center rounded-full text-white transition-all duration-200 hover:bg-white/10 active:scale-[0.97]"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {showPrivateButtons && !isDashboardPage && (
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                title="Dashboard"
                className={`${navTextClass} text-white px-2 sm:px-3 hover:bg-white/10 active:scale-[0.97] hover:text-white`}
              >
                {isMobile && <LayoutDashboard size={18} />}
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            )}

            {showPrivateButtons && (
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className={`${logoutClass} rounded-sm px-1 sm:px-3 sm:py-`}
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex shrink-0 items-center gap-2 rounded-xl px-2 py-2 transition-all duration-200 hover:scale-[1.02]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
            <UtensilsCrossed size={18} strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            DineHub
          </span>
        </button>

        <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          <button
            type="button"
            onClick={toggleDarkMode}
            title={darkMode ? "Light Mode" : "Dark Mode"}
            className={navIconClass}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {showPrivateButtons && !isDashboardPage && (
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              title="Dashboard"
              className={navTextClass}
            >
              {isMobile && <LayoutDashboard size={18} />}
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}

          {showPrivateButtons && !isHealthPage && (
            <button
              type="button"
              onClick={() => navigate("/health")}
              title="Health"
              className={navTextClass}
            >
              {isMobile && <HeartPulse size={18} />}
              <span className="hidden sm:inline">Health</span>
            </button>
          )}

          {pathname !== "/faq" && (
            <button
              type="button"
              onClick={() => navigate("/faq")}
              title="FAQ"
              className={navTextClass}
            >
              {isMobile && <HelpCircle size={18} />}
              <span className="hidden sm:inline">FAQ</span>
            </button>
          )}

          {showPrivateButtons && (
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className={`${logoutClass} rounded-sm px-1 sm:px-3 sm:py-`}
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const location = useLocation();
  const hideFooter =
    location.pathname === "/" || location.pathname === "/health";

  if (hideFooter) return null;

  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-sm text-slate-600 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
      © {new Date().getFullYear()} DineHub
    </footer>
  );
}

function AppShell() {
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
 * Main application component that orchestrates the entire DineHub application.
 * Provides the app shell with dark mode support, navigation, and routing structure.
 *
 * @returns The rendered AppShell component.
 */
export function App() {
  return <AppShell />;
}

export default App;
