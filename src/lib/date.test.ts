import { describe, it, expect } from 'vitest';
import { formatLocalDate, parseLocalDate } from './date';

describe('date-only helpers', () => {
  it('formats a local Date as YYYY-MM-DD without UTC shift', () => {
    // Local midnight July 5 — the classic case that toISOString() shifts to
    // July 4 in positive-UTC zones (e.g. IST). formatLocalDate must not.
    expect(formatLocalDate(new Date(2026, 6, 5))).toBe('2026-07-05');
  });

  it('zero-pads month and day', () => {
    expect(formatLocalDate(new Date(2026, 0, 9))).toBe('2026-01-09');
  });

  it('parses YYYY-MM-DD as a local date, not UTC midnight', () => {
    const d = parseLocalDate('2026-07-05');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6); // July
    expect(d.getDate()).toBe(5);
  });

  it('round-trips a date string back to itself', () => {
    // The property that keeps the calendar, chatbot and admin forms in sync:
    // string -> Date -> string is the identity, in any timezone.
    for (const iso of ['2026-07-04', '2026-07-05', '2026-12-31', '2026-01-01']) {
      expect(formatLocalDate(parseLocalDate(iso))).toBe(iso);
    }
  });
});
