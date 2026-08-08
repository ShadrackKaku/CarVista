import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The expiry sweep moves money outward on a schedule with nobody watching, so
 * the properties worth pinning are the ones that cost real cedis when wrong:
 * it must never refund the same hold twice, and it must never keep a unit off
 * the market because a payment provider was down.
 */

const state = {
  reservations: [] as Array<Record<string, unknown>>,
  refundCalls: [] as Array<{ reference: string; amount?: number }>,
  refundThrows: false,
  syncCalls: [] as string[],
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    importReservation: {
      findMany: vi.fn(async ({ where }: { where: Record<string, any> }) =>
        state.reservations.filter((r) => {
          if (where.status && r.status !== where.status) return false;
          if (where.expiresAt?.lte && (r.expiresAt as Date) > where.expiresAt.lte) return false;
          if ("refundReference" in where && r.refundReference !== where.refundReference) {
            return false;
          }
          if (where.paymentReference?.not === null && r.paymentReference == null) return false;
          return true;
        }),
      ),
      updateMany: vi.fn(
        async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
          const matched = state.reservations.filter((r) => {
            if (r.id !== where.id) return false;
            if ("status" in where && r.status !== where.status) return false;
            if ("refundReference" in where && r.refundReference !== where.refundReference) {
              return false;
            }
            return true;
          });
          for (const r of matched) Object.assign(r, data);
          return { count: matched.length };
        },
      ),
    },
  },
}));

vi.mock("@/lib/paystack", () => ({
  refundTransaction: vi.fn(async (reference: string, amount?: number) => {
    state.refundCalls.push({ reference, amount });
    if (state.refundThrows) throw new Error("Paystack is down");
    return { status: "pending", reference };
  }),
}));

vi.mock("@/lib/reserve-fee", () => ({
  syncListingAvailability: vi.fn(async (id: string) => {
    state.syncCalls.push(id);
  }),
}));

const { expireLapsedReservations } = await import("./expire-reservations");

const NOW = new Date("2026-08-12T09:00:00Z");

function hold(over: Record<string, unknown> = {}) {
  return {
    id: "res-1",
    reference: "RSV-ABCDEF0123",
    feeGhs: 500,
    refundRate: 0.5,
    paymentReference: "RSV-ABCDEF0123",
    refundReference: null,
    status: "ACTIVE",
    expiresAt: new Date("2026-08-12T08:00:00Z"),
    ...over,
  };
}

beforeEach(() => {
  state.reservations = [];
  state.refundCalls = [];
  state.refundThrows = false;
  state.syncCalls = [];
});

describe("expireLapsedReservations", () => {
  it("releases a lapsed hold and refunds the agreed share", async () => {
    state.reservations = [hold()];
    const sweep = await expireLapsedReservations(NOW);

    expect(sweep).toMatchObject({ examined: 1, expired: 1, refunded: 1, refundFailures: 0 });
    expect(state.reservations[0].status).toBe("EXPIRED");
    expect(state.refundCalls).toEqual([{ reference: "RSV-ABCDEF0123", amount: 250 }]);
    expect(state.reservations[0].refundedGhs).toBe(250);
  });

  it("leaves a hold that has not run out alone", async () => {
    state.reservations = [hold({ expiresAt: new Date("2026-08-12T10:00:00Z") })];
    const sweep = await expireLapsedReservations(NOW);
    expect(sweep.examined).toBe(0);
    expect(state.reservations[0].status).toBe("ACTIVE");
    expect(state.refundCalls).toHaveLength(0);
  });

  it("does not refund twice when the job runs twice", async () => {
    // The failure this prevents: cron retries, overlapping regions, a manual
    // re-run. Paying a customer their GH¢250 twice is real money gone.
    state.reservations = [hold()];
    await expireLapsedReservations(NOW);
    const second = await expireLapsedReservations(NOW);

    expect(second).toMatchObject({ examined: 0, expired: 0, refunded: 0 });
    expect(state.refundCalls).toHaveLength(1);
  });

  it("does not refund a hold that already carries a refund reference", async () => {
    // Belt and braces: even if the status were somehow reset to ACTIVE, the
    // recorded reference stops a second payout.
    state.reservations = [hold({ refundReference: "RSV-ALREADY" })];
    const sweep = await expireLapsedReservations(NOW);
    expect(sweep.expired).toBe(1);
    expect(sweep.refunded).toBe(0);
    expect(state.refundCalls).toHaveLength(0);
  });

  it("returns the unit to the market before it tries to move money", async () => {
    // A Paystack outage must not keep an importer's car frozen. The release
    // happens first, so the money can catch up on the next sweep.
    state.reservations = [hold()];
    state.refundThrows = true;
    const sweep = await expireLapsedReservations(NOW);

    expect(state.syncCalls).toEqual(["res-1"]);
    expect(state.reservations[0].status).toBe("EXPIRED");
    expect(sweep).toMatchObject({ expired: 1, refunded: 0, refundFailures: 1 });
  });

  it("pays a refund that failed on an earlier sweep", async () => {
    // The hole this closes: an expired row is no longer ACTIVE, so the first
    // pass never looks at it again. Without a second pass, a Paystack outage
    // at the wrong minute keeps the customer's GH¢250 permanently.
    state.reservations = [hold()];
    state.refundThrows = true;
    await expireLapsedReservations(NOW);
    expect(state.reservations[0].status).toBe("EXPIRED");
    expect(state.reservations[0].refundReference).toBeNull();

    state.refundThrows = false;
    const second = await expireLapsedReservations(NOW);
    expect(second).toMatchObject({ expired: 0, refunded: 1, retried: 1 });
    expect(state.reservations[0].refundedGhs).toBe(250);
  });

  it("stops retrying once the refund has gone through", async () => {
    state.reservations = [hold()];
    state.refundThrows = true;
    await expireLapsedReservations(NOW);
    state.refundThrows = false;
    await expireLapsedReservations(NOW);
    const third = await expireLapsedReservations(NOW);

    expect(third).toMatchObject({ refunded: 0, retried: 0 });
    // Two calls total: the one that threw, and the one that worked.
    expect(state.refundCalls).toHaveLength(2);
  });

  it("refunds nothing when the rate is zero", async () => {
    state.reservations = [hold({ refundRate: 0 })];
    const sweep = await expireLapsedReservations(NOW);
    expect(sweep.expired).toBe(1);
    expect(sweep.refunded).toBe(0);
    expect(state.refundCalls).toHaveLength(0);
  });

  it("honours the rate stored on the row, not today's policy", async () => {
    state.reservations = [hold({ feeGhs: 750, refundRate: 0.3 })];
    await expireLapsedReservations(NOW);
    expect(state.refundCalls[0].amount).toBe(225);
  });

  it("clears several lapsed holds in one sweep", async () => {
    state.reservations = [
      hold({ id: "a", reference: "RSV-A", paymentReference: "RSV-A" }),
      hold({ id: "b", reference: "RSV-B", paymentReference: "RSV-B" }),
      hold({ id: "c", reference: "RSV-C", paymentReference: "RSV-C" }),
    ];
    const sweep = await expireLapsedReservations(NOW);
    expect(sweep).toMatchObject({ examined: 3, expired: 3, refunded: 3 });
    expect(state.syncCalls).toEqual(["a", "b", "c"]);
  });
});
