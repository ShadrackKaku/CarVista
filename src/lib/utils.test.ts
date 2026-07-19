import { describe, it, expect } from "vitest";
import { generateReference } from "@/lib/utils";

describe("generateReference", () => {
  it("uses the given prefix and a hex random suffix", () => {
    const ref = generateReference("PAY");
    expect(ref).toMatch(/^PAY-[A-Z0-9]+-[0-9A-F]{8}$/);
  });

  it("defaults the prefix to CV", () => {
    expect(generateReference()).toMatch(/^CV-/);
  });

  it("is unguessable — no collisions across many calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 5000; i++) seen.add(generateReference("PAY"));
    expect(seen.size).toBe(5000);
  });
});
