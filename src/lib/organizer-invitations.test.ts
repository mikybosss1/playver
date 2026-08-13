import { describe, it, expect } from "vitest";
import { hasExpired } from "./organizer-invitations";

describe("hasExpired", () => {
  it("returns false for a future expiry", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(hasExpired("2026-01-02T00:00:00Z", now)).toBe(false);
  });

  it("returns true for a past expiry", () => {
    const now = new Date("2026-01-02T00:00:00Z");
    expect(hasExpired("2026-01-01T00:00:00Z", now)).toBe(true);
  });

  it("treats the exact boundary as expired", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(hasExpired("2026-01-01T00:00:00Z", now)).toBe(true);
  });

  it("accepts a Date instance as well as a string", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(hasExpired(new Date("2025-12-31T00:00:00Z"), now)).toBe(true);
  });
});
