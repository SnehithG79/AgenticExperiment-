// Clocks. A clock is a function that returns an ISO 8601 time string.

export const FIXED_TIME = "2026-10-26T12:00:00Z";

export function fixedClock(iso = FIXED_TIME) {
  return () => iso;
}

export function systemClock() {
  return () => new Date().toISOString();
}
