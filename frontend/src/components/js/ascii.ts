/**
 * Generates an ASCII table from a list of rows and column names.
 *
 * @param rows - An array of objects representing table rows. Each object maps column names to values.
 * @param cols - An array of column names that define the table structure and order.
 * @returns An array of strings, where each string represents a line of the ASCII table.
 *
 * @remarks
 * - Column widths are automatically calculated based on the longest content in each column,
 *   including the column header.
 * - Missing or undefined values are rendered as empty strings.
 * - The table uses box-drawing characters for borders.
 *
 * @example
 * ```ts
 * const rows = [
 *   { name: "Alice", score: 10 },
 *   { name: "Bob", score: 20 }
 * ];
 *
 * const table = asciiTable(rows, ["name", "score"]);
 * console.log(table.join("\n"));
 * ```
 *
 * Output:
 * ```
 * ┌───────┬───────┐
 * │ name  │ score │
 * ├───────┼───────┤
 * │ Alice │ 10    │
 * │ Bob   │ 20    │
 * └───────┴───────┘
 * ```
 */
export function asciiTable(
  rows: Record<string, unknown>[],
  cols: string[],
): string[] {
  const widths = cols.map((col) =>
    Math.max(col.length, ...rows.map((r) => String(r[col] ?? "").length)),
  );

  const pad = (s: string, w: number) => s + " ".repeat(w - s.length);
  const border = (l: string, m: string, r: string) =>
    l + "─" + widths.map((w) => "─".repeat(w)).join("─" + m + "─") + "─" + r;

  const row = (cells: string[]) =>
    "│ " + cells.map((c, i) => pad(c, widths[i]!)).join(" │ ") + " │";

  return [
    border("┌", "┬", "┐"),
    row(cols),
    border("├", "┼", "┤"),
    ...rows.map((r) => row(cols.map((c) => String(r[c] ?? "")))),
    border("└", "┴", "┘"),
  ];
}
