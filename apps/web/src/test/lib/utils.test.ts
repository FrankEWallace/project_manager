import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatDate,
  formatPercent,
  getInitials,
  avatarGradient,
} from "@/lib/utils";

describe("getInitials", () => {
  it("returns ? for empty input", () => {
    expect(getInitials()).toBe("?");
    expect(getInitials("")).toBe("?");
  });

  it("takes first + last initial for full names", () => {
    expect(getInitials("Ada Lovelace")).toBe("AL");
    expect(getInitials("Grace Brewster Hopper")).toBe("GH");
  });

  it("takes two chars for a single name", () => {
    expect(getInitials("Madonna")).toBe("MA");
  });

  it("derives from the local part of an email", () => {
    expect(getInitials("ada.lovelace@example.com")).toBe("AL");
  });
});

describe("avatarGradient", () => {
  it("is deterministic for the same seed", () => {
    expect(avatarGradient("Ada")).toBe(avatarGradient("Ada"));
  });

  it("returns a CSS linear-gradient", () => {
    expect(avatarGradient("Ada")).toMatch(/^linear-gradient\(/);
  });

  it("handles empty/undefined seeds", () => {
    expect(avatarGradient()).toMatch(/^linear-gradient\(/);
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("drops falsy values", () => {
    expect(cn("foo", undefined, false, "bar")).toBe("foo bar");
  });

  it("resolves tailwind conflicts (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats a different currency", () => {
    expect(formatCurrency(500, "EUR")).toContain("500");
  });
});

describe("formatDate", () => {
  it("formats a Date object", () => {
    // Use UTC-anchored string to avoid timezone flakiness
    const result = formatDate("2024-06-15T12:00:00Z");
    expect(result).toMatch(/Jun\s+\d+,\s+2024/);
  });

  it("accepts a Date instance", () => {
    const result = formatDate(new Date("2024-01-01T12:00:00Z"));
    expect(result).toMatch(/Jan\s+\d+,\s+2024/);
  });
});

describe("formatPercent", () => {
  it("rounds and appends %", () => {
    expect(formatPercent(75)).toBe("75%");
  });

  it("rounds fractional values", () => {
    expect(formatPercent(66.6)).toBe("67%");
  });

  it("handles zero", () => {
    expect(formatPercent(0)).toBe("0%");
  });

  it("handles 100", () => {
    expect(formatPercent(100)).toBe("100%");
  });
});
