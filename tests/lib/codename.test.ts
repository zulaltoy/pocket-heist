import { describe, it, expect } from "vitest";

import { generateCodename, CODENAME_WORD_SETS } from "@/lib/codename";

describe("generateCodename", () => {
  it("returns a PascalCase codename composed of one word from each word set", () => {
    const pattern = new RegExp(
      `^(${CODENAME_WORD_SETS.map((set) => set.join("|")).join(")(")})$`,
    );

    for (let i = 0; i < 20; i++) {
      expect(generateCodename()).toMatch(pattern);
    }
  });

  it("produces varied results across repeated calls", () => {
    const results = new Set(
      Array.from({ length: 30 }, () => generateCodename()),
    );
    expect(results.size).toBeGreaterThan(1);
  });
});
