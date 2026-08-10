import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  can,
  canReachAdmin,
  presetById,
  sanitizePermissions,
  type Permission,
} from "./permissions";

/**
 * Editing a staff member's access.
 *
 * The behaviour that matters is what a change actually does to them: the API
 * writes a column, but the consequence is whether the console opens and which
 * pages answer. These assert the consequence.
 */

const staff = (permissions: string[]) => ({ role: "STAFF" as const, permissions });

describe("changing what a staff member may do", () => {
  it("swapping preset moves the whole boundary, not just the labels", () => {
    // Promoting a content editor to finance must open escrow AND close the blog
    // — a change that only ever adds is how people accumulate access they no
    // longer need.
    const before = staff([...presetById("content_editor")!.permissions]);
    const after = staff([...presetById("finance_officer")!.permissions]);

    expect(can(before, "blog:write")).toBe(true);
    expect(can(before, "escrow:manage")).toBe(false);

    expect(can(after, "escrow:manage")).toBe(true);
    expect(can(after, "blog:write")).toBe(false);
  });

  it("supports somebody who does two jobs", () => {
    // The case presets alone cannot express, and the reason permissions stay
    // the source of truth.
    const both = staff([
      ...presetById("content_editor")!.permissions,
      ...presetById("support_agent")!.permissions,
    ]);
    expect(can(both, "blog:write")).toBe(true);
    expect(can(both, "orders:read")).toBe(true);
    expect(can(both, "escrow:manage")).toBe(false);
  });

  it("revoking everything removes the console but leaves the account", () => {
    // "Remove their access" is an ordinary edit, not a deletion: the person
    // keeps an account they can still sign into as a normal user.
    const revoked = staff([]);
    expect(canReachAdmin(revoked)).toBe(false);
    expect(can(revoked, "blog:write")).toBe(false);
  });

  it("revoking one permission leaves the rest working", () => {
    const before = staff(["blog:write", "orders:read"]);
    const after = staff(["orders:read"]);
    expect(can(before, "blog:write")).toBe(true);
    expect(can(after, "blog:write")).toBe(false);
    expect(can(after, "orders:read")).toBe(true);
    expect(canReachAdmin(after)).toBe(true);
  });

  it("cannot grant the permission that grants permissions", () => {
    // Whatever the request body says. This is the only real escalation path in
    // the whole model, so it is refused at the write boundary and again in
    // `can` — see permissions.test.ts.
    const asked: string[] = ["blog:write", "staff:manage"];
    const stored = sanitizePermissions(asked);
    expect(stored).toEqual(["blog:write"]);
    expect(can(staff(stored), "staff:manage")).toBe(false);
  });

  it("a preset never smuggles escrow in", () => {
    // Re-asserted here because this editor is where a preset is applied in
    // anger, and escrow is one convenient checkbox away from every one of them.
    for (const id of ["content_editor", "verification_officer", "support_agent"]) {
      const applied = sanitizePermissions([...presetById(id)!.permissions]);
      expect(can(staff(applied), "escrow:manage"), id).toBe(false);
    }
  });
});

describe("the editing endpoint", () => {
  const source = readFileSync(
    join(process.cwd(), "src/app/api/admin/staff/[id]/route.ts"),
    "utf8",
  );

  it("is reserved to staff:manage", () => {
    // Delegating the ability to delegate would let any staff member grant
    // themselves everything else.
    expect(source).toMatch(/requirePermission\(\s*"staff:manage"\s*\)/);
  });

  it("refuses to write permissions onto an administrator", () => {
    // An admin's authority comes from their role, so a permission list on one
    // would be a no-op that reads on the page like a real restriction.
    expect(source).toMatch(/target\.role !== "STAFF"/);
  });

  it("refuses to let somebody edit their own access", () => {
    expect(source).toMatch(/target\.id === actor\.id/);
  });

  it("sanitises before writing", () => {
    expect(source).toMatch(/sanitizePermissions\(/);
  });
});

describe("revocation actually takes effect", () => {
  const auth = readFileSync(join(process.cwd(), "src/lib/auth.ts"), "utf8");

  it("re-reads privileged accounts from the database on every request", () => {
    // The session is a 30-day JWT. Without this, a permission revoked today
    // keeps working for a month and the editor is decorative in the one
    // direction that matters.
    expect(auth).toMatch(/token\.role === "STAFF"/);
    expect(auth).toMatch(/privileged/);
  });

  it("strips authority from a suspended administrator", () => {
    // Suspending an account did not previously touch a live token.
    expect(auth).toMatch(/status === "SUSPENDED"/);
  });

  it("does not make ordinary users pay for it", () => {
    // The read is conditional on being privileged; a marketplace of ordinary
    // users must not take a database hit on every request for this.
    const jwtBlock = auth.slice(auth.indexOf("async jwt("), auth.indexOf("async session("));
    expect(jwtBlock).toMatch(/privileged\s*=/);
    expect(jwtBlock).toMatch(/\|\|\s*privileged/);
  });
});
