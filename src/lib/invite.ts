import crypto from "node:crypto";
import { ROLE_PROFILES } from "@/lib/roles";
import { presetById } from "@/lib/permissions";
import { whatsappUrl } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

/**
 * Inviting somebody whose account an administrator created for them.
 *
 * The whole point is that a password never travels. The account is created
 * without one; this issues a single-use link that lets the person choose their
 * own. Nothing sensitive ends up in an inbox, in a WhatsApp thread, or in the
 * memory of whichever staff member did the onboarding.
 */

/**
 * How long an invite stays good for.
 *
 * A password reset lasts an hour because the person asked for it seconds ago
 * and is watching their inbox. An invite is different: it arrives unannounced,
 * possibly while the recipient is driving a customer around Accra, and being
 * made to ask for a second one is a bad first impression. Seven days is long
 * enough to be humane and short enough that a forgotten mailbox does not stay
 * a way in indefinitely.
 */
export const INVITE_EXPIRY_DAYS = 7;

export function inviteExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

/** Unguessable, and never derived from the email or the id. */
export function inviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * What to call the role in a message to the person receiving it.
 *
 * "Set up as DEALER" reads like a database dump. Staff presets are named by the
 * job rather than by the permission list, because "Content editor" is what the
 * person was actually hired as.
 */
export function roleLabelFor(role: UserRole, presetId?: string | null): string {
  if (role === "STAFF") {
    const preset = presetId ? presetById(presetId) : undefined;
    return preset ? `CarVista team — ${preset.label}` : "CarVista team member";
  }
  if (role === "USER") return "a CarVista account";
  const profile = ROLE_PROFILES[role as keyof typeof ROLE_PROFILES];
  return profile?.label ?? role.toLowerCase().replace(/_/g, " ");
}

/**
 * A ready-to-send WhatsApp message for the administrator to tap.
 *
 * Deliberately not sent by us: there is no WhatsApp Business API wired up, so
 * pretending otherwise would mean a notification that silently never arrives.
 * The admin sends it themselves in one tap, from their own number — which is
 * also the number the recipient will recognise.
 *
 * The link is included because that is the whole message; what is NOT included
 * is any credential, for the same reason it is absent from the email.
 */
export function inviteWhatsappUrl(opts: {
  phone: string;
  name: string;
  roleLabel: string;
  url: string;
}): string {
  const first = opts.name.trim().split(/\s+/)[0] || "there";
  const message =
    `Hi ${first}, your CarVista account is ready — set up as ${opts.roleLabel}. ` +
    `Choose your password here (the link works once and expires in ${INVITE_EXPIRY_DAYS} days): ${opts.url}`;
  return whatsappUrl(opts.phone, message);
}
