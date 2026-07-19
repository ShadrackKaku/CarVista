import { describe, it, expect } from "vitest";
import {
  buildMilestonesFromTemplate,
  isMilestonePayable,
  escrowReference,
  STAGE_RANK,
  DEFAULT_MILESTONE_TEMPLATE,
} from "@/lib/escrow";
import type { ImportStage } from "@prisma/client";

describe("buildMilestonesFromTemplate", () => {
  it("always sums back to the exact total (no money lost to rounding)", () => {
    for (const total of [100000, 99999, 7, 1, 123457, 250000, 33333]) {
      const rows = buildMilestonesFromTemplate(total);
      const sum = rows.reduce((s, r) => s + r.amount, 0);
      expect(sum).toBe(total);
    }
  });

  it("produces one installment per template entry, in order, with whole-cedi amounts", () => {
    const rows = buildMilestonesFromTemplate(120000);
    expect(rows).toHaveLength(DEFAULT_MILESTONE_TEMPLATE.length);
    rows.forEach((r, i) => {
      expect(r.sequence).toBe(i);
      expect(Number.isInteger(r.amount)).toBe(true);
      expect(r.unlockStage).toBe(DEFAULT_MILESTONE_TEMPLATE[i].unlockStage);
    });
  });

  it("uses the 20/30/30/20 split for a clean total", () => {
    const rows = buildMilestonesFromTemplate(100000);
    expect(rows.map((r) => r.amount)).toEqual([20000, 30000, 30000, 20000]);
  });

  it("absorbs the rounding remainder into the final installment while keeping amounts positive", () => {
    for (const total of [100003, 100001, 99998, 55555]) {
      const rows = buildMilestonesFromTemplate(total);
      const sum = rows.reduce((s, r) => s + r.amount, 0);
      expect(sum).toBe(total);
      rows.forEach((r) => {
        expect(Number.isInteger(r.amount)).toBe(true);
        expect(r.amount).toBeGreaterThan(0);
      });
      // Only the final installment differs from a clean rounded share.
      const cleanFirst = Math.round(total * DEFAULT_MILESTONE_TEMPLATE[0].percent);
      expect(rows[0].amount).toBe(cleanFirst);
    }
  });
});

describe("isMilestonePayable", () => {
  const unlockStage: ImportStage = "PURCHASED";
  const base = { status: "LOCKED", unlockStage };

  it("is payable only when the plan is ACTIVE", () => {
    expect(isMilestonePayable(base, "PURCHASED", "ACTIVE")).toBe(true);
    expect(isMilestonePayable(base, "PURCHASED", "DRAFT")).toBe(false);
    expect(isMilestonePayable(base, "PURCHASED", "CANCELLED")).toBe(false);
    expect(isMilestonePayable(base, "PURCHASED", "COMPLETED")).toBe(false);
  });

  it("is not payable before the import reaches the unlock stage", () => {
    expect(isMilestonePayable(base, "REQUESTED", "ACTIVE")).toBe(false);
    expect(isMilestonePayable(base, "QUOTED", "ACTIVE")).toBe(false);
  });

  it("is payable once the import reaches or passes the unlock stage", () => {
    expect(isMilestonePayable(base, "PURCHASED", "ACTIVE")).toBe(true);
    expect(isMilestonePayable(base, "IN_TRANSIT", "ACTIVE")).toBe(true);
    expect(isMilestonePayable(base, "DELIVERED", "ACTIVE")).toBe(true);
  });

  it("is never payable once already PAID", () => {
    expect(isMilestonePayable({ status: "PAID", unlockStage }, "DELIVERED", "ACTIVE")).toBe(false);
  });

  it("is never payable when the import is CANCELLED", () => {
    expect(isMilestonePayable(base, "CANCELLED", "ACTIVE")).toBe(false);
  });

  it("treats the deposit (unlock REQUESTED) as payable as soon as the plan is active", () => {
    const deposit = { status: "LOCKED", unlockStage: "REQUESTED" as ImportStage };
    expect(isMilestonePayable(deposit, "REQUESTED", "ACTIVE")).toBe(true);
  });
});

describe("STAGE_RANK", () => {
  it("orders the workflow monotonically and puts CANCELLED outside it", () => {
    expect(STAGE_RANK.REQUESTED).toBeLessThan(STAGE_RANK.PURCHASED);
    expect(STAGE_RANK.PURCHASED).toBeLessThan(STAGE_RANK.CUSTOMS_CLEARANCE);
    expect(STAGE_RANK.CUSTOMS_CLEARANCE).toBeLessThan(STAGE_RANK.DELIVERED);
    expect(STAGE_RANK.CANCELLED).toBeLessThan(STAGE_RANK.REQUESTED);
  });
});

describe("escrowReference", () => {
  it("is uppercase, ESC-prefixed, and unique per call", () => {
    const a = escrowReference("clabc123456");
    const b = escrowReference("clabc123456");
    expect(a).toMatch(/^ESC-[A-Z0-9]+-[A-F0-9]+$/);
    expect(a).toBe(a.toUpperCase());
    expect(a).not.toBe(b);
  });
});
