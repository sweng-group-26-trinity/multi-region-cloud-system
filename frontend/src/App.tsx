import type { ReactNode } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { UtensilsCrossed } from "lucide-react";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LandingPage } from "./pages/LandingPage";
import { RestaurantsPage } from "./pages/RestaurantPage";
import OrdersPage from "./pages/OrdersPage";
import DatabaseHealth from "./pages/DatabaseHealth";
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
              <LandingPage />
            </Page>
          }
        />
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
        <Route
          path="/forgot-password"
          element={
            <Page>
              <ForgotPasswordPage />
            </Page>
          }
        />
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
          path="/health"
          element={
            <Page>
              <DatabaseHealth />
            </Page>
          }
        />
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
 * App shell with generic branding
 */
function AppShell() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-screen bg-white relative">
      {/* Brand Logo */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="fixed top-6 left-6 z-50 rounded-xl px-4 py-2
                   bg-white shadow-md hover:shadow-lg
                   transition-all duration-200
                   hover:scale-[1.03] active:scale-[0.98]
                   flex items-center gap-2"
      >
        <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
          <UtensilsCrossed size={18} strokeWidth={2.5} />
        </div>
        <span className="font-semibold text-slate-900 text-lg">DineHub</span>
      </button>

      <AnimatedRoutes />
    </div>
  );
}

/**
 * Root App
 */
export function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
