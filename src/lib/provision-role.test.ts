import { describe, it, expect, vi } from "vitest";
import { provisionRoleProfile } from "./provision-role";

/**
 * Approval grants a role *and* creates the thing the role operates.
 *
 * Before this existed, approving a dealer set `user.role` and stopped: the
 * console the approval unlocked read from a `Dealer` row that did not exist,
 * and there was no path to create one. These tests pin the two halves together.
 */

type Model = "dealer" | "partsStore" | "serviceProvider" | "supplier" | "importer";

/**
 * A transaction client with just the calls this module makes. `existingUser`
 * and `takenSlugs` let each test set up the collision it wants to check.
 */
function fakeTx(opts: { existingFor?: Model; takenSlugs?: string[] } = {}) {
  const created: Record<string, unknown>[] = [];
  const taken = new Set(opts.takenSlugs ?? []);

  const model = (name: Model) => ({
    findUnique: vi.fn(async ({ where }: { where: { userId?: string; slug?: string } }) => {
      if (where.userId !== undefined) {
        return opts.existingFor === name ? { id: `existing-${name}` } : null;
      }
      return where.slug && taken.has(where.slug) ? { id: "clash" } : null;
    }),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      created.push({ model: name, ...data });
      return data;
    }),
  });

  return {
    tx: {
      dealer: model("dealer"),
      partsStore: model("partsStore"),
      serviceProvider: model("serviceProvider"),
      supplier: model("supplier"),
      importer: model("importer"),
    },
    created,
  };
}

const DETAILS = {
  businessName: "Tema Motors",
  phone: "0201234567",
  city: "Tema",
  region: "Greater Accra",
  message: "Trading since 2015.",
};

describe("provisionRoleProfile", () => {
  it.each([
    ["DEALER", "dealer", "businessName"],
    ["PARTS_SELLER", "partsStore", "storeName"],
    ["SERVICE_PROVIDER", "serviceProvider", "businessName"],
    ["SUPPLIER", "supplier", "businessName"],
    ["IMPORTER", "importer", "businessName"],
  ] as const)("creates the %s profile", async (role, model, nameField) => {
    const { tx, created } = fakeTx();
    const result = await provisionRoleProfile(tx as never, "user-1", role, DETAILS);

    expect(result.created).toBe(model);
    expect(created).toHaveLength(1);
    expect(created[0].model).toBe(model);
    expect(created[0][nameField]).toBe("Tema Motors");
    expect(created[0].slug).toBe("tema-motors");
    // The applicant already typed these; making them retype is the friction
    // this whole function exists to remove.
    expect(created[0].phone).toBe("0201234567");
    expect(created[0].city).toBe("Tema");
    expect(created[0].description).toBe("Trading since 2015.");
  });

  it("gives a new importer empty source markets, not undefined", async () => {
    // Prisma rejects `undefined` for a required list field, and the console
    // reads `.length` on it without guarding.
    const { tx, created } = fakeTx();
    await provisionRoleProfile(tx as never, "user-1", "IMPORTER", DETAILS);
    expect(created[0].sourceMarkets).toEqual([]);
  });

  it("is idempotent — a second grant leaves the existing profile alone", async () => {
    // A role can be granted, changed, and granted again. The second approval
    // must not blow up on the unique userId, nor overwrite work the user has
    // since put into their profile.
    const { tx, created } = fakeTx({ existingFor: "dealer" });
    const result = await provisionRoleProfile(tx as never, "user-1", "DEALER", DETAILS);
    expect(result).toEqual({ created: null, alreadyExisted: true });
    expect(created).toHaveLength(0);
  });

  it("works around a taken slug rather than failing", async () => {
    const { tx, created } = fakeTx({ takenSlugs: ["tema-motors", "tema-motors-2"] });
    await provisionRoleProfile(tx as never, "user-1", "DEALER", DETAILS);
    expect(created[0].slug).toBe("tema-motors-3");
  });

  it("still produces a usable profile when the name is missing or unsluggable", async () => {
    const { tx, created } = fakeTx();
    await provisionRoleProfile(tx as never, "user-1", "SUPPLIER", {
      businessName: "   ",
      phone: null,
      city: null,
      region: null,
      message: null,
    });
    expect(created[0].businessName).toBe("My business");
    expect(created[0].slug).toBe("my-business");
    expect(created[0].description).toBeNull();
  });

  it("gives a new supplier empty arrays, not undefined", async () => {
    // Prisma rejects `undefined` for a required list field, and the console
    // reads `.length` on both without guarding.
    const { tx, created } = fakeTx();
    await provisionRoleProfile(tx as never, "user-1", "SUPPLIER", DETAILS);
    expect(created[0].categories).toEqual([]);
    expect(created[0].servesRegions).toEqual([]);
  });
});
