import { describe, it, expect } from "vitest";
import { isOrderRefundable } from "@/lib/fulfill-order";

describe("isOrderRefundable", () => {
  it("only a successfully-paid order with no refund yet is refundable", () => {
    expect(isOrderRefundable({ status: "SUCCESS", refundStatus: "NONE" })).toBe(true);
  });

  it("rejects orders that aren't paid", () => {
    expect(isOrderRefundable({ status: "PENDING", refundStatus: "NONE" })).toBe(false);
    expect(isOrderRefundable({ status: "FAILED", refundStatus: "NONE" })).toBe(false);
  });

  it("rejects orders already in or past a refund", () => {
    expect(isOrderRefundable({ status: "SUCCESS", refundStatus: "PENDING" })).toBe(false);
    expect(isOrderRefundable({ status: "SUCCESS", refundStatus: "REFUNDED" })).toBe(false);
    expect(isOrderRefundable({ status: "SUCCESS", refundStatus: "FAILED" })).toBe(false);
  });
});
