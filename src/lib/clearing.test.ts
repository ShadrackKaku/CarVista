import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  agentsForPort,
  assessmentFromClearance,
  assignBlockedReason,
  canAssignAgent,
  canRecordClearance,
  dutyVariance,
  varianceSummary,
} from "./clearing";
import type { ImportStage } from "@prisma/client";

describe("when an agent can be engaged", () => {
  it("allows it while the car is at the port", () => {
    expect(canAssignAgent("ARRIVED_AT_PORT")).toBe(true);
    expect(canAssignAgent("CUSTOMS_CLEARANCE")).toBe(true);
  });

  it("refuses a car still at sea", () => {
    // An agent engaged on a vehicle mid-ocean has nothing to do and no signal
    // when it lands; by arrival their licence may have lapsed.
    const early: ImportStage[] = ["REQUESTED", "QUOTED", "PURCHASED", "SHIPPING_PENDING", "IN_TRANSIT"];
    for (const stage of early) expect(canAssignAgent(stage)).toBe(false);
    expect(assignBlockedReason("IN_TRANSIT")).toMatch(/reaches the port/i);
  });

  it("refuses a car that has already cleared", () => {
    expect(canAssignAgent("READY_FOR_DELIVERY")).toBe(false);
    expect(assignBlockedReason("DELIVERED")).toMatch(/already cleared/i);
  });

  it("uses the same window for recording the clearance", () => {
    // Recording twice would overwrite one customs entry number with another,
    // and a vehicle only ever has one.
    for (const stage of ["ARRIVED_AT_PORT", "CUSTOMS_CLEARANCE", "DELIVERED", "IN_TRANSIT"] as ImportStage[]) {
      expect(canRecordClearance(stage)).toBe(canAssignAgent(stage));
    }
  });
});

describe("which agents a buyer is offered", () => {
  const agents = [
    { id: "a", verified: true, ports: ["Tema"] },
    { id: "b", verified: true, ports: ["Takoradi"] },
    { id: "c", verified: false, ports: ["Tema"] },
    { id: "d", verified: true, ports: [] },
  ];

  it("never offers an unverified agent", () => {
    // The entire reason to engage a broker here rather than through a WhatsApp
    // contact is that somebody has checked the licence.
    expect(agentsForPort(agents, "Tema").map((a) => a.id)).not.toContain("c");
  });

  it("only offers agents who work that port", () => {
    expect(agentsForPort(agents, "Tema").map((a) => a.id)).not.toContain("b");
    expect(agentsForPort(agents, "Takoradi").map((a) => a.id)).toContain("b");
  });

  it("still offers an agent who has not said where they work", () => {
    // The field is optional; silence is not evidence they are in the wrong place.
    expect(agentsForPort(agents, "Tema").map((a) => a.id)).toContain("d");
  });

  it("ignores case and stray spacing on the port", () => {
    expect(agentsForPort(agents, "  tema ").map((a) => a.id)).toContain("a");
  });

  it("falls back to every verified agent when the port is unknown", () => {
    expect(agentsForPort(agents, null).map((a) => a.id)).toEqual(["a", "b", "d"]);
  });
});

describe("what we said against what it was", () => {
  it("reports an overshoot", () => {
    const v = dutyVariance(78_000, 82_000)!;
    expect(v.delta).toBe(4_000);
    expect(v.direction).toBe("over");
    expect(v.percent).toBeCloseTo(5.128, 2);
  });

  it("reports an undershoot", () => {
    const v = dutyVariance(78_000, 74_000)!;
    expect(v.direction).toBe("under");
    expect(v.delta).toBe(-4_000);
  });

  it("does not call a few pesewas a miss", () => {
    expect(dutyVariance(78_000, 78_000.4)!.direction).toBe("exact");
  });

  it("says nothing when there was no estimate to judge", () => {
    expect(dutyVariance(null, 74_000)).toBeNull();
    expect(dutyVariance(0, 74_000)).toBeNull();
    expect(dutyVariance(78_000, null)).toBeNull();
  });

  it("puts it in words", () => {
    expect(varianceSummary(dutyVariance(78_000, 82_000))).toBe("5.1% more than we estimated.");
    expect(varianceSummary(dutyVariance(78_000, 74_000))).toBe("5.1% less than we estimated.");
    expect(varianceSummary(dutyVariance(78_000, 78_000))).toBe("Exactly as estimated.");
    expect(varianceSummary(null)).toBeNull();
  });
});

describe("turning a clearance into training data", () => {
  const record = {
    make: "Toyota",
    modelType: "Harrier",
    yearOfManufacture: 2019,
    port: "Tema",
    totalTax: 82_000,
    predictedTotalTax: 78_000,
    customsEntryNumber: "TEMA-2026-114857",
    submittedById: "user-1",
  };

  it("arrives PENDING, never verified", () => {
    // The schema's own warning is that one bad bill must not poison a cohort.
    // A transposed digit here would drag every future estimate for this model.
    expect(assessmentFromClearance(record).status).toBe("PENDING");
  });

  it("is attributed to the agent who paid it", () => {
    const a = assessmentFromClearance(record);
    expect(a.source).toBe("AGENT");
    expect(a.submittedById).toBe("user-1");
  });

  it("carries the prediction alongside the truth, which is the calibration signal", () => {
    const a = assessmentFromClearance(record);
    expect(a.totalTax).toBe(82_000);
    expect(a.predictedTotalTax).toBe(78_000);
  });

  it("keeps the entry number, so the figure is checkable rather than asserted", () => {
    expect(assessmentFromClearance(record).notes).toMatch(/TEMA-2026-114857/);
  });

  it("survives an import that was never quoted", () => {
    const a = assessmentFromClearance({ ...record, predictedTotalTax: null });
    expect(a.predictedTotalTax).toBeNull();
    expect(a.totalTax).toBe(82_000);
  });
});

describe("the clearance route", () => {
  const route = readFileSync(join(process.cwd(), "src/app/api/clearing/[id]/route.ts"), "utf8");

  it("lets only the engaged agent or an admin record it", () => {
    // Not the buyer: the value of the figure is that it comes from the person
    // who actually paid the bill.
    expect(route).toMatch(/isAssignedAgent && !isAdmin/);
  });

  it("refuses to clear the same car twice", () => {
    expect(route).toMatch(/request\.clearedAt/);
  });

  it("writes the assessment through the PENDING helper, not by hand", () => {
    expect(route).toMatch(/assessmentFromClearance/);
    expect(route).not.toMatch(/status:\s*"VERIFIED"/);
  });
});
