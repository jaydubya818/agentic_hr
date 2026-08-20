import { describe, expect, it } from 'vitest';

import { escapeCsvCell } from './csv';

describe('escapeCsvCell', () => {
  it('returns plain values unchanged', () => {
    expect(escapeCsvCell('hello')).toBe('hello');
    expect(escapeCsvCell('')).toBe('');
  });

  it('quotes values containing commas, quotes, or newlines', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"');
    expect(escapeCsvCell('line1\rline2')).toBe('"line1\rline2"');
  });

  it('neutralizes formula-injection prefixes', () => {
    expect(escapeCsvCell('=SUM(A1:A9)')).toBe("'=SUM(A1:A9)");
    expect(escapeCsvCell('+1')).toBe("'+1");
    expect(escapeCsvCell('-1')).toBe("'-1");
    expect(escapeCsvCell('@cmd')).toBe("'@cmd");
  });

  it('quotes and neutralizes combined cases', () => {
    expect(escapeCsvCell('=HYPERLINK("http://x")')).toBe('"\'=HYPERLINK(""http://x"")"');
  });

  it('neutralizes a formula hidden behind leading whitespace', () => {
    // Excel and LibreOffice trim leading whitespace before parsing the cell,
    // so a first-character-only check is bypassed by a single space.
    expect(escapeCsvCell(' =SUM(A1:A9)')).toBe("' =SUM(A1:A9)");
    expect(escapeCsvCell("  =cmd|'/c calc'!A0")).toBe("'  =cmd|'/c calc'!A0");
    expect(escapeCsvCell('\u00a0@cmd')).toBe("'\u00a0@cmd");
  });

  it('does not alter interior special characters', () => {
    expect(escapeCsvCell('a=b')).toBe('a=b');
    expect(escapeCsvCell('a@b.com')).toBe('a@b.com');
  });
});
