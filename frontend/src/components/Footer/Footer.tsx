/**
 * Footer component for the application.
 *
 * Displays a simple footer section at the bottom of the page
 * containing the application copyright and the current year.
 *
 * The footer automatically updates the year using JavaScript's
 * Date object to avoid manual updates each year.
 *
 * @returns The application footer element.
 */
export default function Footer() {
  return (
    <footer style={styles.footer}>
      <p>© {new Date().getFullYear()} FoodApp</p>
    </footer>
  );
}

/**
 * Inline style definitions for the footer layout.
 */
const styles = {
  /**
   * Footer container styling.
   *
   * - `marginTop: auto` keeps the footer pushed to the bottom
   *   when used inside a flex column layout.
   * - Adds spacing and a subtle top border for visual separation
   *   from the main page content.
   */
  footer: {
    marginTop: "auto",
    padding: "1rem",
    borderTop: "1px solid #ddd",
    textAlign: "center" as const,
  },
};
