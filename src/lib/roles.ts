import type { UserRole } from "@prisma/client";

/**
 * What each role means, and which of them a person can ask for.
 *
 * The rule the whole system rests on: registration creates a `USER` and nothing
 * else. Every other role is granted — by an administrator approving a
 * `RoleApplication` — never chosen. Keeping the applicable set in one exported
 * constant means the form, the API and the admin queue cannot disagree about
 * what is grantable, and no code path can quietly add `ADMIN` to it.
 */

/** The role every account starts as. */
export const BASE_ROLE: UserRole = "USER";

/** Roles a signed-in user may apply for. Administrative roles are never here. */
export const APPLICABLE_ROLES = [
  "DEALER",
  "PARTS_SELLER",
  "SERVICE_PROVIDER",
  "SUPPLIER",
  "IMPORTER",
  "CLEARING_AGENT",
] as const satisfies readonly UserRole[];

export type ApplicableRole = (typeof APPLICABLE_ROLES)[number];

/**
 * Roles that carry platform-wide authority. These are assigned out of band —
 * there is no request path to them, by design.
 */
const ADMIN_ROLES: readonly UserRole[] = ["ADMIN", "SUPER_ADMIN"];

export function isApplicableRole(role: string): role is ApplicableRole {
  return (APPLICABLE_ROLES as readonly string[]).includes(role);
}

/** Admin console and admin APIs. Super admins are admins plus more. */
export function isAdmin(role: UserRole | null | undefined): boolean {
  return role != null && ADMIN_ROLES.includes(role);
}

/** The highest tier: role and permission management, platform configuration. */
export function isSuperAdmin(role: UserRole | null | undefined): boolean {
  return role === "SUPER_ADMIN";
}

/** Whether a role may list vehicles as a business rather than as an individual. */
export function isDealer(role: UserRole | null | undefined): boolean {
  return role === "DEALER" || isAdmin(role);
}

/** Whether a role may run a parts store. */
export function isPartsSeller(role: UserRole | null | undefined): boolean {
  return role === "PARTS_SELLER" || isAdmin(role);
}

/** Whether a role may run a wholesale supply business. */
export function isSupplier(role: UserRole | null | undefined): boolean {
  return role === "SUPPLIER" || isAdmin(role);
}

export function isImporter(role: UserRole | null | undefined): boolean {
  return role === "IMPORTER" || isAdmin(role);
}

/**
 * Whether a role may clear vehicles through customs.
 *
 * The role alone is not enough to be *offered* work: an agent must also carry
 * `ClearingAgent.verified`, which an administrator turns on after seeing the
 * licence. This function answers "may they open the clearing workspace", not
 * "should buyers be told this agent is licensed".
 */
export function isClearingAgent(role: UserRole | null | undefined): boolean {
  return role === "CLEARING_AGENT" || isAdmin(role);
}

export interface RoleProfile {
  role: ApplicableRole;
  label: string;
  /** One line, shown on the card a user picks from. */
  blurb: string;
  /** What approval unlocks — concrete, so the choice is informed. */
  unlocks: string[];
  /** Fields the application form requires for this role. */
  requires: readonly ("businessName" | "businessRegNumber" | "phone" | "city")[];
}

export const ROLE_PROFILES: Record<ApplicableRole, RoleProfile> = {
  DEALER: {
    role: "DEALER",
    label: "Dealer",
    blurb: "Sell vehicles as a registered dealership.",
    unlocks: [
      "A dealer profile buyers can browse",
      "Leads and enquiry management",
      "Listing analytics",
      "The verified-dealer badge, once your documents check out",
    ],
    requires: ["businessName", "businessRegNumber", "phone", "city"],
  },
  PARTS_SELLER: {
    role: "PARTS_SELLER",
    label: "Parts seller",
    blurb: "Run a parts store on the marketplace.",
    unlocks: [
      "A storefront for your catalogue",
      "Stock and order management",
      "Sales analytics",
    ],
    requires: ["businessName", "phone", "city"],
  },
  SERVICE_PROVIDER: {
    role: "SERVICE_PROVIDER",
    label: "Service provider",
    blurb: "Offer garage, inspection or detailing services.",
    unlocks: [
      "A service listing customers can book",
      "Booking requests in your inbox",
      "Reviews from customers you've served",
    ],
    requires: ["businessName", "phone", "city"],
  },
  SUPPLIER: {
    role: "SUPPLIER",
    label: "Supplier",
    blurb: "Supply vehicles or parts wholesale to dealers and stores.",
    unlocks: ["Wholesale enquiries from verified buyers", "Bulk listing tools"],
    requires: ["businessName", "businessRegNumber", "phone"],
  },
  IMPORTER: {
    role: "IMPORTER",
    label: "Importer",
    blurb: "Source and clear vehicles on behalf of buyers.",
    unlocks: [
      "Import requests routed to you",
      "Clearing and shipment tracking tools",
      "Landed-cost quoting for customers",
    ],
    requires: ["businessName", "businessRegNumber", "phone", "city"],
  },
  CLEARING_AGENT: {
    role: "CLEARING_AGENT",
    label: "Clearing agent",
    blurb: "Clear vehicles through customs as a licensed broker.",
    unlocks: [
      "Vehicles at your port assigned to you",
      "Record the duty actually paid against the entry number",
      "The verified-agent badge, once your Customs licence checks out",
    ],
    // The registration number is the licence conversation starting: an agent
    // who cannot produce one cannot be verified, and an unverified agent is
    // never offered a car.
    requires: ["businessName", "businessRegNumber", "phone", "city"],
  },
};

/** Human label for any role, for tables and badges. */
export function roleLabel(role: UserRole): string {
  if (role === "USER") return "User";
  if (role === "ADMIN") return "Admin";
  if (role === "SUPER_ADMIN") return "Super admin";
  return ROLE_PROFILES[role as ApplicableRole]?.label ?? role;
}
