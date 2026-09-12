import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, isThemePreference } from "@/lib/theme/types";

describe("theme preference contract", () => {
  it("defaults to the system theme", () => {
    expect(DEFAULT_THEME).toBe("system");
  });

  it("accepts only supported theme values", () => {
    expect(["light", "dark", "system"].every(isThemePreference)).toBe(true);
    expect(isThemePreference("sepia")).toBe(false);
    expect(isThemePreference(null)).toBe(false);
    expect(isThemePreference(1)).toBe(false);
  });
});
