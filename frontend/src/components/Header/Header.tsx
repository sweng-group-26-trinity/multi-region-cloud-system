import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const pathname = location.pathname;

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isDashboardPage = pathname.startsWith("/dashboard");
  const isHealthPage = pathname.startsWith("/health");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header style={styles.header}>
      <div style={styles.topRow}>
        <div style={styles.logo}>
          <Link to="/" style={styles.logoLink}>
            🍽 DineHub
          </Link>
        </div>

        <nav style={styles.nav}>
          {!isDashboardPage && (
            <Link to="/dashboard" style={styles.link}>
              Dashboard
            </Link>
          )}

          {!isHealthPage && (
            <Link to="/health" style={styles.link}>
              Health
            </Link>
          )}

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

const styles = {
  header: {
    position: "sticky" as const,
    top: 0,
    zIndex: 1000,
    backgroundColor: "#fff",
    borderBottom: "1px solid #ddd",
    padding: "0.75rem 1rem",
  },

  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    flexWrap: "wrap" as const,
  },

  logo: {
    fontSize: "1.4rem",
    fontWeight: "bold",
    flexShrink: 0,
  },

  logoLink: {
    textDecoration: "none",
    color: "#111827",
  },

  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "0.5rem",
    flexWrap: "wrap" as const,
  },

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
