import { describe, it, expect } from "vitest";
import {
  ALL_PERMISSIONS,
  PERMISSIONS,
  STAFF_PRESETS,
  SUPER_ADMIN_ONLY,
  can,
  canReachAdmin,
  permissionsOf,
  presetById,
  sanitizePermissions,
  type Permission,
} from "./permissions";

const staff = (...permissions: Permission[]) => ({ role: "STAFF" as const, permissions });

describe("can", () => {
  it("gives the super admin everything", () => {
    for (const p of ALL_PERMISSIONS) {
      expect(can({ role: "SUPER_ADMIN" }, p), p).toBe(true);
    }
  });

  it("gives an admin everything except the power to create administrators", () => {
    // The distinction that makes SUPER_ADMIN mean something. Without it, the
    // first person promoted to admin can promote anyone else, and the founder
    // has no way to hand out limited authority that stays limited.
    for (const p of ALL_PERMISSIONS) {
      expect(can({ role: "ADMIN" }, p), p).toBe(p !== "staff:manage");
    }
  });

  it("gives staff exactly what was granted", () => {
    const editor = staff("blog:write");
    expect(can(editor, "blog:write")).toBe(true);
    expect(can(editor, "escrow:manage")).toBe(false);
    expect(can(editor, "users:read")).toBe(false);
  });

  it("gives staff with no grants nothing", () => {
    for (const p of ALL_PERMISSIONS) {
      expect(can({ role: "STAFF", permissions: [] }, p), p).toBe(false);
    }
  });

  it("refuses staff:manage to staff even when the column contains it", () => {
    // Defence in depth. sanitizePermissions stops it being written, but a bad
    // migration, a restored backup or a direct database edit would otherwise be
    // enough to mint a second super admin. The check that runs on every request
    // is the better place to be certain.
    expect(can(staff("staff:manage" as Permission), "staff:manage")).toBe(false);
    // The rest of that account's grants still work — this refuses one
    // permission, it does not void the whole row.
    expect(can(staff("staff:manage" as Permission, "blog:write"), "blog:write")).toBe(true);
  });

  it("treats a marketplace role as no authority at all", () => {
    // A DEALER is not a small admin. This is the check that stops "they run a
    // business on the platform" from drifting into "they can see other people's
    // orders".
    for (const role of ["USER", "DEALER", "PARTS_SELLER", "SUPPLIER", "IMPORTER"] as const) {
      for (const p of ALL_PERMISSIONS) {
        expect(can({ role }, p), `${role} ${p}`).toBe(false);
      }
    }
  });

  it("refuses a missing or signed-out principal", () => {
    expect(can(null, "blog:write")).toBe(false);
    expect(can(undefined, "blog:write")).toBe(false);
    expect(can({ role: null }, "blog:write")).toBe(false);
  });
});

describe("canReachAdmin", () => {
  it("admits admins and any staff member with at least one grant", () => {
    expect(canReachAdmin({ role: "SUPER_ADMIN" })).toBe(true);
    expect(canReachAdmin({ role: "ADMIN" })).toBe(true);
    expect(canReachAdmin(staff("blog:write"))).toBe(true);
  });

  it("shuts out staff who hold nothing", () => {
    // Someone whose permissions were all revoked should stop seeing the console
    // rather than land on an empty shell of pages that all 403.
    expect(canReachAdmin({ role: "STAFF", permissions: [] })).toBe(false);
    expect(canReachAdmin({ role: "STAFF", permissions: null })).toBe(false);
  });

  it("shuts out everyone else", () => {
    expect(canReachAdmin({ role: "DEALER" })).toBe(false);
    expect(canReachAdmin(null)).toBe(false);
  });
});

describe("staff presets", () => {
  it("every preset is made of real permissions", () => {
    for (const preset of STAFF_PRESETS) {
      for (const p of preset.permissions) {
        expect(ALL_PERMISSIONS, `${preset.id} → ${p}`).toContain(p);
      }
    }
  });

  it("no preset can hand out the power to create administrators", () => {
    // The escalation this closes: a preset containing staff:manage would let
    // anyone holding it grant themselves every other permission.
    for (const preset of STAFF_PRESETS) {
      for (const reserved of SUPER_ADMIN_ONLY) {
        expect(preset.permissions, `${preset.id}`).not.toContain(reserved);
      }
    }
  });

  it("keeps money out of the presets that are not about money", () => {
    // A content editor or a support agent must not be able to move cedis. This
    // is the specific mistake worth pinning: escrow is one convenient-looking
    // checkbox away from every preset.
    for (const id of ["content_editor", "verification_officer", "support_agent"]) {
      expect(presetById(id)!.permissions, id).not.toContain("escrow:manage");
    }
    expect(presetById("finance_officer")!.permissions).toContain("escrow:manage");
  });

  it("gives the content editor nothing but writing", () => {
    expect(presetById("content_editor")!.permissions).toEqual(["blog:write"]);
  });

  it("has a label and a blurb for each, since an admin picks from them", () => {
    for (const preset of STAFF_PRESETS) {
      expect(preset.label, preset.id).toBeTruthy();
      expect(preset.blurb.length, preset.id).toBeGreaterThan(20);
      expect(preset.permissions.length, preset.id).toBeGreaterThan(0);
    }
  });

  it("has a unique id per preset", () => {
    const ids = STAFF_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("sanitizePermissions", () => {
  it("keeps real permissions", () => {
    expect(sanitizePermissions(["blog:write", "users:read"])).toEqual([
      "blog:write",
      "users:read",
    ]);
  });

  it("drops the reserved one, whatever the form posted", () => {
    // The actual escalation path: a hand-crafted request adding staff:manage to
    // the checkbox list would otherwise mint a second super admin.
    expect(sanitizePermissions(["blog:write", "staff:manage"])).toEqual(["blog:write"]);
  });

  it("drops anything that is not a permission", () => {
    expect(sanitizePermissions(["blog:write", "*", "admin", "", "escrow:*"])).toEqual([
      "blog:write",
    ]);
  });

  it("de-duplicates and returns a stable order", () => {
    // Stable order keeps the stored array comparable, so an audit diff shows a
    // real change rather than a reshuffle.
    expect(sanitizePermissions(["users:read", "blog:write", "users:read"])).toEqual([
      "blog:write",
      "users:read",
    ]);
  });

  it("copes with nothing", () => {
    expect(sanitizePermissions(null)).toEqual([]);
    expect(sanitizePermissions(undefined)).toEqual([]);
    expect(sanitizePermissions([])).toEqual([]);
  });
});

describe("the catalogue itself", () => {
  it("explains every permission in words an admin can act on", () => {
    for (const p of ALL_PERMISSIONS) {
      expect(PERMISSIONS[p].length, p).toBeGreaterThan(15);
    }
  });

  it("warns that escrow moves real money", () => {
    // The one checkbox whose description has to do work.
    expect(PERMISSIONS["escrow:manage"]).toMatch(/real money/i);
  });

  it("lists permissionsOf consistently with can", () => {
    for (const principal of [
      { role: "SUPER_ADMIN" as const },
      { role: "ADMIN" as const },
      staff("blog:write", "orders:read"),
      { role: "DEALER" as const },
    ]) {
      for (const p of ALL_PERMISSIONS) {
        expect(permissionsOf(principal).includes(p), `${principal.role} ${p}`).toBe(
          can(principal, p),
        );
      }
    }
  });
});
