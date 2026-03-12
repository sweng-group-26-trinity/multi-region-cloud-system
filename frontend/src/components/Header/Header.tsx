import { Link, useLocation, useNavigate } from "react-router-dom";

/**
 * Header component for the application.
 *
 * Displays the app logo and top-level navigation links.
 * The component conditionally renders authentication actions
 * depending on the current route and whether a token exists
 * in local storage.
 *
 * Behaviour:
 * - Always shows the logo
 * - Always shows Dashboard and Health links
 * - Hides auth action on login and signup pages
 * - Shows Logout when a user token exists
 * - Shows Login when no user token exists
 *
 * @returns The application header.
 */
export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Authentication token stored in local storage.
   * Used to determine whether the user is currently logged in.
   */
  const token = localStorage.getItem("token");

  /**
   * Determines whether the current page is an authentication page.
   * On these pages, the login/logout action is hidden.
   */
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  /**
   * Handles user logout.
   *
   * Removes the stored authentication token and redirects
   * the user to the login page.
   */
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header style={styles.header}>
      {/* Logo / brand section */}
      <div style={styles.logo}>
        <Link to="/">🍽 FoodApp</Link>
      </div>

      {/* Main navigation links */}
      <nav style={styles.nav}>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/health">Health</Link>

        {!isAuthPage &&
          (token ? (
            <button onClick={handleLogout} style={styles.button}>
              Logout
            </button>
          ) : (
            <Link to="/login">Login</Link>
          ))}
      </nav>
    </header>
  );
}

/**
 * Inline style definitions for the header layout and controls.
 */
const styles = {
  /**
   * Main header container styling.
   */
  header: {
    display: "flex",
    justifyContent: "space-between",
    padding: "1rem 2rem",
    borderBottom: "1px solid #ddd",
    alignItems: "center",
  },

  /**
   * Logo text styling.
   */
  logo: {
    fontSize: "1.4rem",
    fontWeight: "bold",
  },

  /**
   * Navigation container styling.
   */
  nav: {
    display: "flex",
    gap: "1.5rem",
    alignItems: "center",
  },

  /**
   * Logout button styling.
   */
  button: {
    padding: "6px 12px",
    cursor: "pointer",
  },
};
