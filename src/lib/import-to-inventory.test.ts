import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INVENTORY_READY_STAGES,
  STAGE_TO_PASSPORT,
  canEnterInventory,
  conditionForImport,
  inventoryBlockedReason,
  landedCostOf,
  passportBackfill,
  vehicleTitleFor,
} from "./import-to-inventory";
import type { ImportStage } from "@prisma/client";

/**
 * The bridge between an import and a car you own.
 *
 * `ImportRequest.vehicleId` sat in the schema unwritten, and the passport
 * mirroring in the admin tracker was guarded behind it — so the trust timeline
 * this platform is built on had never recorded a single event. These tests hold
 * that seam shut.
 */

describe("when a car may be taken into inventory", () => {
  it("allows it only after customs", () => {
    expect(canEnterInventory("READY_FOR_DELIVERY")).toBe(true);
    expect(canEnterInventory("DELIVERED")).toBe(true);
  });

  it("refuses a car still at sea or still at the port", () => {
    // The failure this prevents: listing a car for sale that is sitting
    // uncleared at Tema. Duty unpaid, cannot be registered, cannot be handed
    // over — a promise the seller has no way to keep.
    const tooEarly: ImportStage[] = [
      "REQUESTED",
      "QUOTED",
      "VEHICLE_SELECTED",
      "PURCHASED",
      "SHIPPING_PENDING",
      "IN_TRANSIT",
      "ARRIVED_AT_PORT",
      "CUSTOMS_CLEARANCE",
    ];
    for (const stage of tooEarly) {
      expect(canEnterInventory(stage), `${stage} must not be inventory-ready`).toBe(false);
    }
  });

  it("refuses a cancelled import", () => {
    expect(canEnterInventory("CANCELLED")).toBe(false);
    expect(inventoryBlockedReason("CANCELLED")).toMatch(/cancelled/i);
  });

  it("explains itself when the answer is no", () => {
    expect(inventoryBlockedReason("CUSTOMS_CLEARANCE")).toMatch(/clears/i);
    expect(inventoryBlockedReason("IN_TRANSIT")).toBeTruthy();
    expect(inventoryBlockedReason("DELIVERED")).toBeNull();
  });

  it("keeps the ready set to exactly the two post-clearance stages", () => {
    expect([...INVENTORY_READY_STAGES]).toEqual(["READY_FOR_DELIVERY", "DELIVERED"]);
  });
});

describe("the title a human would have typed", () => {
  it("builds it from the parts", () => {
    expect(vehicleTitleFor({ year: 2019, make: "Toyota", model: "Harrier", trim: "Premium" })).toBe(
      "2019 Toyota Harrier Premium",
    );
  });

  it("copes without a trim", () => {
    expect(vehicleTitleFor({ year: 2021, make: "Honda", model: "CR-V", trim: null })).toBe(
      "2021 Honda CR-V",
    );
    expect(vehicleTitleFor({ year: 2021, make: "Honda", model: "CR-V", trim: "  " })).toBe(
      "2021 Honda CR-V",
    );
  });
});

describe("condition of a car that just landed", () => {
  const now = new Date("2026-08-14");

  it("is never Ghana-used — it has never been used in Ghana", () => {
    for (const year of [2015, 2020, 2024, 2026]) {
      for (const mileage of [0, 500, 90_000]) {
        expect(conditionForImport({ year, mileage, now })).not.toBe("GHANA_USED");
      }
    }
  });

  it("is foreign-used for ordinary stock", () => {
    expect(conditionForImport({ year: 2019, mileage: 62_000, now })).toBe("FOREIGN_USED");
  });

  it("is new only for genuinely delivery-mileage stock", () => {
    expect(conditionForImport({ year: 2026, mileage: 12, now })).toBe("NEW");
    expect(conditionForImport({ year: 2025, mileage: 0, now })).toBe("NEW");
  });

  it("does not let an old car with a rolled-back odometer claim to be new", () => {
    // Both halves of the test must pass, which is the point: low mileage alone
    // is not evidence of a new car, and a recent year alone is not either.
    expect(conditionForImport({ year: 2016, mileage: 5, now })).toBe("FOREIGN_USED");
    expect(conditionForImport({ year: 2026, mileage: 40_000, now })).toBe("FOREIGN_USED");
  });

  it("treats a missing odometer as used rather than new", () => {
    expect(conditionForImport({ year: 2019, mileage: null, now })).toBe("FOREIGN_USED");
  });
});

describe("replaying the shipment onto the passport", () => {
  const events = [
    { stage: "REQUESTED" as const, title: "Request received", timestamp: new Date("2026-05-01") },
    { stage: "PURCHASED" as const, title: "Won at Nagoya", location: "Nagoya", timestamp: new Date("2026-06-03") },
    { stage: "IN_TRANSIT" as const, title: "Vessel departed", location: "Yokohama", timestamp: new Date("2026-06-12") },
    { stage: "IN_TRANSIT" as const, title: "Mid-ocean update", timestamp: new Date("2026-06-20") },
    { stage: "ARRIVED_AT_PORT" as const, title: "Berthed at Tema", location: "Tema", timestamp: new Date("2026-07-01") },
    { stage: "CUSTOMS_CLEARANCE" as const, title: "Duty paid, entry passed", timestamp: new Date("2026-07-02") },
  ];

  it("carries the real dates across", () => {
    // Without this the passport would claim the car's life began the day it was
    // listed — which is exactly the unverifiable history every other site has.
    const backfill = passportBackfill(events);
    expect(backfill.map((e) => e.occurredAt.toISOString().slice(0, 10))).toEqual([
      "2026-06-03",
      "2026-06-12",
      "2026-07-01",
      "2026-07-02",
    ]);
  });

  it("records one entry per milestone, at the moment it happened", () => {
    // Two IN_TRANSIT updates, one shipping milestone, dated at the first.
    const shipped = passportBackfill(events).filter((e) => e.type === "SHIPPED");
    expect(shipped).toHaveLength(1);
    expect(shipped[0].occurredAt).toEqual(new Date("2026-06-12"));
  });

  it("leaves paperwork stages off the car's history", () => {
    const titles = passportBackfill(events).map((e) => e.title);
    expect(titles).not.toContain("Request received");
    expect(STAGE_TO_PASSPORT.REQUESTED).toBeUndefined();
    expect(STAGE_TO_PASSPORT.QUOTED).toBeUndefined();
  });

  it("keeps the operator's own words and grounds them in a place", () => {
    const purchase = passportBackfill(events).find((e) => e.type === "IMPORTED");
    expect(purchase?.notes).toBe("Won at Nagoya · Nagoya");
  });

  it("returns them oldest first, whatever order they arrived in", () => {
    const shuffled = [...events].reverse();
    const backfill = passportBackfill(shuffled);
    const times = backfill.map((e) => e.occurredAt.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it("survives an import with no tracking history at all", () => {
    expect(passportBackfill([])).toEqual([]);
  });
});

describe("what the car cost to land", () => {
  it("prefers the quoted total", () => {
    expect(landedCostOf({ quotedTotal: 248_400, quotedCif: 1, quotedDuty: 2 })).toBe(248_400);
  });

  it("adds the parts up when there is no total", () => {
    expect(landedCostOf({ quotedCif: 150_000, quotedDuty: 78_000, quotedShipping: 20_400 })).toBe(
      248_400,
    );
  });

  it("returns null rather than a misleading zero", () => {
    // A listing opened at GH¢0 because we had no quote would be a mistake
    // somebody could publish by accident.
    expect(landedCostOf({})).toBeNull();
    expect(landedCostOf({ quotedTotal: 0 })).toBeNull();
  });
});

describe("the seam itself", () => {
  const route = readFileSync(
    join(process.cwd(), "src/app/api/import-requests/[id]/inventory/route.ts"),
    "utf8",
  );

  it("writes vehicleId, which is what switches the passport mirror on", () => {
    // The whole reason this bridge exists. The admin tracker already mirrors
    // stage changes onto the passport behind `if (request.vehicleId …)`; until
    // something set it, that code could never run.
    expect(route).toMatch(/data:\s*\{\s*vehicleId:/);
  });

  it("carries the chassis number over as the VIN", () => {
    // The passport is keyed on VIN. Drop it here and every imported car gets a
    // synthesised identity that can never be matched to the physical vehicle.
    expect(route).toMatch(/vin:\s*stock\?\.chassisNumber/);
  });

  it("checks ownership before creating anything", () => {
    expect(route).toMatch(/request\.userId !== user\.id/);
  });

  it("never publishes the car on the owner's behalf", () => {
    // A vehicle appearing on the marketplace priced at its landed cost, without
    // anyone confirming it, is a listing nobody meant to make.
    expect(route).toMatch(/status:\s*"DRAFT"/);
    expect(route).not.toMatch(/status:\s*"ACTIVE"/);
  });
});
