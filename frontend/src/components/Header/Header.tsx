import { Link, useLocation, useNavigate } from "react-router-dom";

/**
 * Header component for the application.
 *
 * Provides top-level navigation and branding for the app.
 * The header is responsive and remains fixed at the top of the screen
 * while scrolling (sticky positioning).
 *
 * Behaviour:
 * - Always displays the DineHub logo (links to home page)
 * - Hides "Dashboard" button when already on the dashboard page
 * - Hides "Health" button when already on the health page
 * - Hides auth actions on login/signup pages
 * - Displays "Logout" when user is authenticated (token exists)
 * - Displays "Login" when user is not authenticated
 *
 * @returns The application header component
 */
export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Authentication token stored in local storage.
   * Determines whether the user is logged in.
   */
  const token = localStorage.getItem("token");

  /**
   * Current route pathname.
   */
  const pathname = location.pathname;

  /**
   * Determines if the current page is an authentication page.
   * Used to hide login/logout buttons.
   */
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  /**
   * Determines if the current page is the dashboard.
   * Used to avoid showing redundant navigation.
   */
  const isDashboardPage = pathname.startsWith("/dashboard");

  /**
   * Determines if the current page is the health page.
   */
  const isHealthPage = pathname.startsWith("/health");

  /**
   * Handles user logout.
   *
   * Clears authentication token and redirects
   * the user to the login page.
   */
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header style={styles.header}>
      {/* Top row containing logo and navigation */}
      <div style={styles.topRow}>
        {/* Logo / branding */}
        <div style={styles.logo}>
          <Link to="/" style={styles.logoLink}>
            🍽 DineHub
          </Link>
        </div>

        {/* Navigation links */}
        <nav style={styles.nav}>
          {/* Dashboard (hidden if already on dashboard) */}
          {!isDashboardPage && (
            <Link to="/dashboard" style={styles.link}>
              Dashboard
            </Link>
          )}

          {/* Health (hidden if already on health page) */}
          {!isHealthPage && (
            <Link to="/health" style={styles.link}>
              Health
            </Link>
          )}

          {/* Auth actions */}
          {!isAuthPage &&
            (token ? (
              <button onClick={handleLogout} style={styles.button}>
                Logout
              </button>
            ) : (
              <Link to="/login" style={styles.link}>
                Login
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}

/**
 * Inline style definitions for the header layout and controls.
 */
const styles = {
  /**
   * Main header container.
   * Sticky positioning ensures it remains visible at the top when scrolling.
   */
  header: {
    position: "sticky" as const,
    top: 0,
    zIndex: 1000,
    backgroundColor: "#fff",
    borderBottom: "1px solid #ddd",
    padding: "0.75rem 1rem",
  },

  /**
   * Layout for top row containing logo and navigation.
   * Flex wrapping ensures responsiveness on smaller screens.
   */
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    flexWrap: "wrap" as const,
  },

  /**
   * Logo styling.
   */
  logo: {
    fontSize: "1.4rem",
    fontWeight: "bold",
    flexShrink: 0,
  },

  /**
   * Logo link styling.
   */
  logoLink: {
    textDecoration: "none",
    color: "#111827",
  },

  /**
   * Navigation container styling.
   * Wraps on small screens to prevent overflow.
   */
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "0.5rem",
    flexWrap: "wrap" as const,
  },

  /**
   * Navigation link styling.
   */
  link: {
    textDecoration: "none",
    color: "#111827",
    fontWeight: 500,
    padding: "0.45rem 0.7rem",
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "#fff",
    fontSize: "0.9rem",
    whiteSpace: "nowrap" as const,
  },

  /**
   * Button styling (used for logout).
   */
  button: {
    padding: "0.45rem 0.7rem",
    cursor: "pointer",
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "#fff",
    color: "#111827",
    fontWeight: 500,
    fontSize: "0.9rem",
    whiteSpace: "nowrap" as const,
  },
};
