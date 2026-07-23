import { describe, it, expect } from "vitest";
import { calculateFinancing } from "./financing-calculator";

describe("calculateFinancing", () => {
  it("splits an interest-free loan evenly and pays it down to zero", () => {
    const r = calculateFinancing({
      vehiclePrice: 100000,
      downPayment: 20000,
      annualRatePercent: 0,
      termMonths: 10,
    });
    expect(r.loanAmount).toBe(80000);
    expect(r.monthlyPayment).toBe(8000);
    expect(r.totalInterest).toBe(0);
    expect(r.totalPayable).toBe(80000);
    expect(r.schedule).toHaveLength(10);
    expect(r.schedule.at(-1)!.balance).toBeCloseTo(0, 6);
  });

  it("amortises a loan with interest and honours the invariants", () => {
    const r = calculateFinancing({
      vehiclePrice: 100000,
      downPayment: 20000,
      annualRatePercent: 12, // 1% monthly
      termMonths: 12,
    });
    expect(r.loanAmount).toBe(80000);
    expect(r.schedule).toHaveLength(12);
    // Balance is fully paid off by the final row.
    expect(r.schedule.at(-1)!.balance).toBeCloseTo(0, 2);
    // First month's interest = opening balance * monthly rate.
    expect(r.schedule[0].interest).toBeCloseTo(80000 * 0.01, 6);
    // A financed loan costs more than the principal, and less than double it here.
    expect(r.totalInterest).toBeGreaterThan(0);
    expect(r.totalPayable).toBeCloseTo(r.loanAmount + r.totalInterest, 4);
    // Sum of scheduled payments reconciles with the total payable.
    const paid = r.schedule.reduce((s, row) => s + row.payment, 0);
    expect(paid).toBeCloseTo(r.totalPayable, 0);
    // Monthly payment exceeds the interest-free floor.
    expect(r.monthlyPayment).toBeGreaterThan(r.loanAmount / 12);
  });

  it("clamps the loan to zero when the down payment covers the price", () => {
    const r = calculateFinancing({
      vehiclePrice: 50000,
      downPayment: 60000,
      annualRatePercent: 24,
      termMonths: 24,
    });
    expect(r.loanAmount).toBe(0);
    expect(r.monthlyPayment).toBe(0);
    expect(r.totalInterest).toBe(0);
  });

  it("rounds a fractional term to whole months", () => {
    const r = calculateFinancing({
      vehiclePrice: 12000,
      downPayment: 0,
      annualRatePercent: 0,
      termMonths: 12.4,
    });
    expect(r.termMonths).toBe(12);
    expect(r.schedule).toHaveLength(12);
  });
});
