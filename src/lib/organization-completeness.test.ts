import { describe, it, expect } from "vitest";
import { computeCompleteness, type CompletenessFields } from "./organization-completeness";

const EMPTY: CompletenessFields = {
  logoUrl: null,
  coverImageUrl: null,
  shortDescription: null,
  mission: null,
  publicEmail: null,
  phone: null,
  sports: [],
  primaryLanguage: null,
};

describe("computeCompleteness", () => {
  it("returns 0 when nothing is filled", () => {
    expect(computeCompleteness(EMPTY)).toBe(0);
  });

  it("returns 100 when every field is filled", () => {
    expect(
      computeCompleteness({
        logoUrl: "https://x/logo.png",
        coverImageUrl: "https://x/cover.png",
        shortDescription: "A great academy",
        mission: "Develop athletes",
        publicEmail: "hello@example.com",
        phone: "555-1234",
        sports: ["soccer"],
        primaryLanguage: "en",
      })
    ).toBe(100);
  });

  it("computes a partial percentage rounded to the nearest whole number", () => {
    // 2 of 8 fields filled = 25%
    expect(computeCompleteness({ ...EMPTY, logoUrl: "https://x/logo.png", phone: "555-1234" })).toBe(25);
  });

  it("treats whitespace-only strings as empty", () => {
    expect(computeCompleteness({ ...EMPTY, shortDescription: "   " })).toBe(0);
  });

  it("counts a non-empty sports array but not an empty one", () => {
    expect(computeCompleteness({ ...EMPTY, sports: ["soccer"] })).toBe(13);
    expect(computeCompleteness({ ...EMPTY, sports: [] })).toBe(0);
  });
});
