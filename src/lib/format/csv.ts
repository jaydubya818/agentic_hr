/**
 * CSV cell escaping for exports.
 *
 * Quotes cells containing delimiters/quotes/newlines per RFC 4180 and
 * neutralizes spreadsheet formula injection (CWE-1236) by prefixing
 * cells that start with a formula trigger character with a single quote.
 */
const NEEDS_QUOTING = /[",\n\r]/;
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function escapeCsvCell(value: string): string {
  let cell = value;
  if (FORMULA_PREFIX.test(cell)) {
    cell = `'${cell}`;
  }
  if (NEEDS_QUOTING.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}
