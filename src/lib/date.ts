// Date-only helpers for menu dates.
//
// Menu rows store a calendar day as a plain "YYYY-MM-DD" string (no time, no
// zone). The bug we keep hitting is round-tripping those through UTC:
//   - `new Date(y, m, d).toISOString()` shifts the day BACKWARD in positive-UTC
//     zones (e.g. IST midnight July 5 -> "2026-07-04" in UTC).
//   - `new Date("2026-07-05")` parses as UTC midnight, which renders as the
//     PREVIOUS day in negative-UTC zones.
// Both make the calendar/chatbot disagree about which day a menu falls on.
//
// Rule: keep date-only values in LOCAL space. Format Dates with
// formatLocalDate, and parse "YYYY-MM-DD" strings with parseLocalDate. Never
// send a date-only value through toISOString().

/** Format a Date as a local "YYYY-MM-DD" (no UTC conversion). */
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a "YYYY-MM-DD" string as a local-midnight Date (not UTC). */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Today as a local "YYYY-MM-DD". */
export function todayLocalDate(): string {
  return formatLocalDate(new Date());
}
