import { describe, it, expect } from "vitest";
import { ownershipTransferSchema } from "@/lib/validations";

describe("ownershipTransferSchema", () => {
  it("accepts a valid email (with optional note)", () => {
    expect(ownershipTransferSchema.safeParse({ email: "buyer@example.com" }).success).toBe(true);
    expect(
      ownershipTransferSchema.safeParse({ email: "buyer@example.com", note: "Sold privately" })
        .success,
    ).toBe(true);
  });

  it("rejects a missing or malformed email", () => {
    expect(ownershipTransferSchema.safeParse({}).success).toBe(false);
    expect(ownershipTransferSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });

  it("rejects an over-long note", () => {
    expect(
      ownershipTransferSchema.safeParse({ email: "a@b.com", note: "x".repeat(501) }).success,
    ).toBe(false);
  });
});
