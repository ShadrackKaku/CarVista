import type { UserRole } from "@prisma/client";

/**
 * What a member of staff is allowed to do.
 *
 * The platform used to have one administrative switch: `isAdmin`, true for both
 * ADMIN and SUPER_ADMIN, checked identically by all twenty admin pages. That is
 * fine while the only administrator is the founder, and wrong the moment
 * somebody is hired to write blog posts — because the same account that
 * publishes an article can also issue an escrow refund.
 *
 * So authority is expressed as named permissions, and staff hold a set of them.
 * Presets exist for the jobs people actually do; permissions remain the source
 * of truth, so somebody who does two jobs gets both sets rather than needing a
 * new role invented for them.
 */

/**
 * Every permission, with the sentence shown next to its checkbox.
 *
 * Namespaced `area:verb`. Read and write are separated wherever the write is
 * something you would not hand a new hire on their first day.
 */
export const PERMISSIONS = {
  "blog:write": "Write, edit and publish blog posts and guides",
  "users:read": "View user accounts and their details",
  "users:manage": "Suspend, restore and close user accounts",
  "verification:review": "Approve or reject dealer verifications and role applications",
  "dealers:manage": "Manage dealer accounts and their standing",
  "listings:moderate": "Moderate vehicle and parts listings",
  "reviews:moderate": "Approve, hide or remove reviews",
  "inspections:manage": "Schedule and record vehicle inspections",
  "orders:read": "View parts orders and their status",
  "imports:manage": "Manage import requests and their timelines",
  "escrow:manage": "Release and refund escrow — moves real money",
  "duty:manage": "Change the duty and levy rates every calculator quotes from",
  "assessments:review": "Verify customs assessments and import ICUMS data",
  "staff:manage": "Create accounts, assign roles and grant permissions",
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

/**
 * Permissions no preset may contain.
 *
 * `staff:manage` is the one that grants permissions, so putting it in a preset
 * would let anyone holding that preset promote themselves to everything else.
 * It stays with SUPER_ADMIN alone.
 */
export const SUPER_ADMIN_ONLY: readonly Permission[] = ["staff:manage"];

export interface StaffPreset {
  id: string;
  label: string;
  /** One line, shown on the card the admin picks from. */
  blurb: string;
  permissions: readonly Permission[];
}

/**
 * The jobs people are actually hired for.
 *
 * Deliberately narrow. A preset that quietly includes `escrow:manage` because
 * it seemed convenient is how a support agent ends up able to move money.
 */
export const STAFF_PRESETS: readonly StaffPreset[] = [
  {
    id: "content_editor",
    label: "Content editor",
    blurb: "Writes and publishes blog posts and guides. No access to users, money or settings.",
    permissions: ["blog:write"],
  },
  {
    id: "verification_officer",
    label: "Verification officer",
    blurb:
      "Reviews dealer verifications, identity documents and role applications. Cannot touch money.",
    permissions: ["verification:review", "users:read", "dealers:manage"],
  },
  {
    id: "support_agent",
    label: "Support agent",
    blurb: "Handles day-to-day problems: users, orders, reviews, inspections and import requests.",
    permissions: [
      "users:read",
      "reviews:moderate",
      "inspections:manage",
      "orders:read",
      "imports:manage",
    ],
  },
  {
    id: "finance_officer",
    label: "Finance & data officer",
    blurb: "Escrow, refunds, duty rates and the assessment data behind the calculators.",
    permissions: ["escrow:manage", "orders:read", "duty:manage", "assessments:review"],
  },
];

export function presetById(id: string): StaffPreset | undefined {
  return STAFF_PRESETS.find((p) => p.id === id);
}

/** The shape `can` needs — a session user or a database row. */
export interface Principal {
  role: UserRole | null | undefined;
  permissions?: readonly string[] | null;
}

/**
 * Whether this principal may do the thing.
 *
 * SUPER_ADMIN holds everything. ADMIN holds everything except `staff:manage`,
 * which keeps the ability to *create* administrators with the founder rather
 * than with anyone the founder promotes. STAFF hold exactly what was granted,
 * and every other role holds nothing at all — a DEALER is not a small admin.
 */
export function can(principal: Principal | null | undefined, permission: Permission): boolean {
  if (!principal?.role) return false;
  if (principal.role === "SUPER_ADMIN") return true;
  if (principal.role === "ADMIN") return !SUPER_ADMIN_ONLY.includes(permission);
  if (principal.role !== "STAFF") return false;
  // Refused for staff whatever the stored column says. `sanitizePermissions`
  // stops it being written, but a bad migration, a restored backup or a direct
  // database edit would otherwise be enough to mint a second super admin — and
  // the check that runs on every request is the better place to be certain.
  if (SUPER_ADMIN_ONLY.includes(permission)) return false;
  return (principal.permissions ?? []).includes(permission);
}

/** True when the principal may reach the admin console at all. */
export function canReachAdmin(principal: Principal | null | undefined): boolean {
  if (!principal?.role) return false;
  if (principal.role === "ADMIN" || principal.role === "SUPER_ADMIN") return true;
  if (principal.role !== "STAFF") return false;
  return (principal.permissions ?? []).length > 0;
}

/** Everything this principal can do, for rendering nav and permission pickers. */
export function permissionsOf(principal: Principal | null | undefined): Permission[] {
  return ALL_PERMISSIONS.filter((p) => can(principal, p));
}

/**
 * Keep only strings that are real permissions, and never one reserved to the
 * super admin. Applied to anything arriving from a form: a hand-crafted request
 * asking for `staff:manage` must not be able to mint a second super admin.
 */
export function sanitizePermissions(input: readonly string[] | null | undefined): Permission[] {
  const seen = new Set<string>(input ?? []);
  return ALL_PERMISSIONS.filter((p) => seen.has(p) && !SUPER_ADMIN_ONLY.includes(p));
}
