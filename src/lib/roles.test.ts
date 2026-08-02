import { describe, it, expect } from "vitest";
import {
  APPLICABLE_ROLES,
  BASE_ROLE,
  ROLE_PROFILES,
  isAdmin,
  isApplicableRole,
  isDealer,
  isPartsSeller,
  isSuperAdmin,
  roleLabel,
} from "./roles";
import { roleApplicationSchema, roleApplicationReviewSchema } from "./validations";

describe("the role model", () => {
  it("starts every account as USER", () => {
    expect(BASE_ROLE).toBe("USER");
  });

  it("never lets an administrative role be applied for", () => {
    // This is the whole point of the applicable set. If ADMIN ever appears
    // here, self-service privilege escalation is back.
    for (const forbidden of ["ADMIN", "SUPER_ADMIN", "USER"]) {
      expect(APPLICABLE_ROLES as readonly string[]).not.toContain(forbidden);
      expect(isApplicableRole(forbidden)).toBe(false);
    }
  });

  it("describes every applicable role, so the picker can't show a blank card", () => {
    for (const role of APPLICABLE_ROLES) {
      const profile = ROLE_PROFILES[role];
      expect(profile.label.length).toBeGreaterThan(0);
      expect(profile.blurb.length).toBeGreaterThan(0);
      expect(profile.unlocks.length).toBeGreaterThan(0);
      expect(profile.requires.length).toBeGreaterThan(0);
    }
  });

  it("treats a super admin as an admin everywhere", () => {
    expect(isAdmin("SUPER_ADMIN")).toBe(true);
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isSuperAdmin("ADMIN")).toBe(false);
    // Admins reach the consoles too — they support the people who run them.
    expect(isDealer("SUPER_ADMIN")).toBe(true);
    expect(isPartsSeller("SUPER_ADMIN")).toBe(true);
  });

  it("keeps every other role out of the admin area", () => {
    for (const role of ["USER", ...APPLICABLE_ROLES] as const) {
      expect(isAdmin(role)).toBe(false);
    }
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it("does not confuse a dealer with a parts seller", () => {
    expect(isDealer("PARTS_SELLER")).toBe(false);
    expect(isPartsSeller("DEALER")).toBe(false);
  });

  it("labels every role", () => {
    expect(roleLabel("USER")).toBe("User");
    expect(roleLabel("SUPER_ADMIN")).toBe("Super admin");
    expect(roleLabel("DEALER")).toBe("Dealer");
    expect(roleLabel("IMPORTER")).toBe("Importer");
  });
});

describe("roleApplicationSchema", () => {
  const dealer = {
    requestedRole: "DEALER",
    businessName: "Tema Motors",
    businessRegNumber: "CS123456789",
    phone: "0201234567",
    city: "Tema",
  };

  it("accepts a complete dealer application", () => {
    expect(roleApplicationSchema.safeParse(dealer).success).toBe(true);
  });

  it("rejects a request for an administrative role", () => {
    for (const role of ["ADMIN", "SUPER_ADMIN"]) {
      expect(roleApplicationSchema.safeParse({ ...dealer, requestedRole: role }).success).toBe(
        false,
      );
    }
  });

  it("ignores a status smuggled into the body", () => {
    // Only a reviewer sets status. It is not a field, so zod strips it and the
    // route's `create` cannot see it even if a caller sends APPROVED.
    const parsed = roleApplicationSchema.safeParse({ ...dealer, status: "APPROVED" });
    expect(parsed.success).toBe(true);
    expect(parsed.success && "status" in parsed.data).toBe(false);
  });

  it("enforces exactly the fields the chosen role requires", () => {
    // A dealer needs a registration number; a parts seller does not. The
    // requirement comes from ROLE_PROFILES, so this can't drift from the form.
    expect(
      roleApplicationSchema.safeParse({ ...dealer, businessRegNumber: "" }).success,
    ).toBe(false);
    expect(
      roleApplicationSchema.safeParse({
        requestedRole: "PARTS_SELLER",
        businessName: "SpeedSpares",
        phone: "0201234567",
        city: "Accra",
      }).success,
    ).toBe(true);
  });

  it("validates the phone number and any document URLs", () => {
    expect(roleApplicationSchema.safeParse({ ...dealer, phone: "12345" }).success).toBe(false);
    expect(
      roleApplicationSchema.safeParse({ ...dealer, documentUrls: ["not-a-url"] }).success,
    ).toBe(false);
    expect(
      roleApplicationSchema.safeParse({
        ...dealer,
        documentUrls: ["https://res.cloudinary.com/x/cert.jpg"],
      }).success,
    ).toBe(true);
  });
});

describe("roleApplicationReviewSchema", () => {
  it("approves without ceremony but demands a reason to reject", () => {
    expect(roleApplicationReviewSchema.safeParse({ action: "APPROVE" }).success).toBe(true);
    expect(roleApplicationReviewSchema.safeParse({ action: "REJECT" }).success).toBe(false);
    expect(
      roleApplicationReviewSchema.safeParse({
        action: "REJECT",
        reviewNote: "Registration number doesn't match the RGD record.",
      }).success,
    ).toBe(true);
  });

  it("has no third verb — a decision is approve or reject", () => {
    expect(roleApplicationReviewSchema.safeParse({ action: "GRANT_ADMIN" }).success).toBe(false);
  });
});
