import { describe, it, expect } from "vitest";
import { toPesewas, settledAsExpected } from "@/lib/paystack";

describe("toPesewas", () => {
  it("converts major units to integer pesewas", () => {
    expect(toPesewas(1)).toBe(100);
    expect(toPesewas(120000)).toBe(12000000);
    expect(toPesewas(10.1)).toBe(1010);
    expect(toPesewas(10.99)).toBe(1099);
  });

  it("always returns an integer", () => {
    for (const v of [10.005, 33333.33, 0.1, 999.999]) {
      expect(Number.isInteger(toPesewas(v))).toBe(true);
    }
  });
});

describe("settledAsExpected", () => {
  it("passes only when amount AND currency match exactly", () => {
    expect(settledAsExpected({ amount: 12000000, currency: "GHS" }, 120000)).toBe(true);
    expect(settledAsExpected({ amount: 12000000, currency: "GHS" }, 120000, "GHS")).toBe(true);
  });

  it("rejects an underpayment", () => {
    expect(settledAsExpected({ amount: 100, currency: "GHS" }, 120000)).toBe(false);
  });

  it("rejects an overpayment", () => {
    expect(settledAsExpected({ amount: 12000001, currency: "GHS" }, 120000)).toBe(false);
  });

  it("rejects a wrong currency", () => {
    expect(settledAsExpected({ amount: 12000000, currency: "NGN" }, 120000, "GHS")).toBe(false);
    expect(settledAsExpected({ amount: 12000000, currency: "USD" }, 120000)).toBe(false);
  });

  it("compares currency case-insensitively", () => {
    expect(settledAsExpected({ amount: 100, currency: "ghs" }, 1, "GHS")).toBe(true);
  });
});
