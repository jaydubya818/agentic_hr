/**
 * CSV cell escaping for exports.
 *
 * Quotes cells containing delimiters/quotes/newlines per RFC 4180 and
 * neutralizes spreadsheet formula injection (CWE-1236) by prefixing
 * cells that start with a formula trigger character with a single quote.
 */
const NEEDS_QUOTING = /[",\n\r]/;
/**
 * Leading whitespace is skipped deliberately. Excel and LibreOffice both trim
 * it while parsing a cell, so " =cmd|'/c calc'!A0" is evaluated as a formula
 * even though its first character is a space -- a documented bypass of a
 * first-character-only check.
 */
const FORMULA_PREFIX = /^[\s\u00a0]*[=+\-@\t\r]/;

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
