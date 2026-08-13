import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("EMB Training")).toBe("emb-training");
  });

  it("strips accents", () => {
    expect(slugify("École de Football")).toBe("ecole-de-football");
  });

  it("collapses non-alphanumeric runs into a single hyphen", () => {
    expect(slugify("Foo!!  Bar--Baz")).toBe("foo-bar-baz");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("--Foo Bar--")).toBe("foo-bar");
  });

  it("truncates to 60 characters", () => {
    const long = "a".repeat(100);
    expect(slugify(long).length).toBe(60);
  });

  it("handles already-clean slugs unchanged", () => {
    expect(slugify("club-atlas")).toBe("club-atlas");
  });
});
