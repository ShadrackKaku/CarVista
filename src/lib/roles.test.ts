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
import {
  roleApplicationSchema,
  roleApplicationReviewSchema,
  supplierEnquirySchema,
  supplierEnquiryReplySchema,
  supplierProfileSchema,
} from "./validations";

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

describe("supplier schemas", () => {
  it("accepts a wholesale enquiry and rejects an empty one", () => {
    const valid = { supplierId: "sup_1", item: "Corolla brake pads", quantity: "200 sets" };
    expect(supplierEnquirySchema.safeParse(valid).success).toBe(true);
    expect(supplierEnquirySchema.safeParse({ ...valid, item: "x" }).success).toBe(false);
    expect(supplierEnquirySchema.safeParse({ item: "pads" }).success).toBe(false);
  });

  it("will not let a buyer set the status or the supplier's reply", () => {
    // Those belong to the supplier. Neither is a field, so zod strips them and
    // the route's `create` never sees them.
    const parsed = supplierEnquirySchema.safeParse({
      supplierId: "sup_1",
      item: "Corolla brake pads",
      status: "QUOTED",
      response: "GH¢12 a set",
    });
    expect(parsed.success).toBe(true);
    expect(parsed.success && "status" in parsed.data).toBe(false);
    expect(parsed.success && "response" in parsed.data).toBe(false);
  });

  it("requires a quote to carry the actual quote", () => {
    expect(supplierEnquiryReplySchema.safeParse({ status: "QUOTED" }).success).toBe(false);
    expect(
      supplierEnquiryReplySchema.safeParse({ status: "QUOTED", response: "GH¢12/set, 30 days" })
        .success,
    ).toBe(true);
    // Declining needs no explanation — silence is an answer there.
    expect(supplierEnquiryReplySchema.safeParse({ status: "DECLINED" }).success).toBe(true);
  });

  it("keeps verification out of a supplier's own hands", () => {
    // `verified`, `featured` and `rating` are things the platform says about a
    // supplier. If the profile schema accepted them, a supplier could award
    // itself the badge buyers rely on.
    const parsed = supplierProfileSchema.safeParse({
      businessName: "Accra Parts Wholesale",
      categories: ["PARTS"],
      verified: true,
      featured: true,
      rating: 5,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect("verified" in parsed.data).toBe(false);
      expect("featured" in parsed.data).toBe(false);
      expect("rating" in parsed.data).toBe(false);
    }
  });

  it("rejects a category that is not a real one", () => {
    expect(
      supplierProfileSchema.safeParse({ businessName: "X", categories: ["SPACESHIPS"] }).success,
    ).toBe(false);
  });
});
