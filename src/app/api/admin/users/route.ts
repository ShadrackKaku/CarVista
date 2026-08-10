import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-guard";
import { provisionRoleProfile } from "@/lib/provision-role";
import { adminCreateUserSchema } from "@/lib/validations";
import { presetById, sanitizePermissions } from "@/lib/permissions";
import { accountInviteEmail, sendMail } from "@/lib/email";
import { INVITE_EXPIRY_DAYS, inviteExpiry, inviteToken, inviteWhatsappUrl, roleLabelFor } from "@/lib/invite";
import { absoluteUrl } from "@/lib/utils";
import type { ApplicableRole } from "@/lib/roles";

/**
 * POST /api/admin/users — create an account on somebody's behalf.
 *
 * The point of this route is that a dealer you have already met should not have
 * to go and register themselves, then apply for a role, then wait to be
 * approved. You enter what they gave you and they get a link.
 *
 * Three things it deliberately does not do:
 *
 *  - It never sets a password. The account is created without one and the
 *    person chooses their own through a single-use link, so no credential ever
 *    sits in an inbox or a chat thread, and no member of staff knows it.
 *  - It cannot create an ADMIN or SUPER_ADMIN — those are absent from
 *    CREATABLE_ROLES, so an escalation path never runs through this form.
 *  - It does not send WhatsApp. There is no Business API wired up, so it
 *    returns a prepared link for the administrator to tap rather than claiming
 *    to have sent something that never arrives.
 */
export async function POST(req: Request) {
  const { user: actor, error } = await requirePermission("staff:manage");
  if (error) return error;

  const parsed = adminCreateUserSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid details" },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Someone already has an account with that email address." },
      { status: 409 },
    );
  }

  // Staff permissions come from the preset when one was chosen, and are always
  // put through the sanitiser — a hand-crafted request asking for staff:manage
  // must not be able to mint a second super admin.
  const preset = input.role === "STAFF" && input.preset ? presetById(input.preset) : undefined;
  const permissions =
    input.role === "STAFF"
      ? sanitizePermissions(preset ? [...preset.permissions] : (input.permissions ?? []))
      : [];

  if (input.role === "STAFF" && permissions.length === 0) {
    return NextResponse.json(
      { error: "That staff member would be able to do nothing. Choose a role for them." },
      { status: 400 },
    );
  }

  const token = inviteToken();

  try {
    const created = await prisma.$transaction(async (tx) => {
      const account = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone || null,
          role: input.role,
          permissions,
          city: input.city || null,
          region: input.region || null,
          // No hashedPassword: the account cannot be signed into until the
          // invite is accepted, which is what makes an unread invite harmless.
          invitedById: actor.id,
          invitedAt: new Date(),
        },
        select: { id: true, name: true, email: true, role: true },
      });

      // A marketplace role without its profile row is the dead-role bug all
      // over again — the account would carry DEALER and have nowhere to list.
      if (input.role !== "USER" && input.role !== "STAFF") {
        await provisionRoleProfile(tx, account.id, input.role as ApplicableRole, {
          businessName: input.businessName || null,
          phone: input.phone || null,
          city: input.city || null,
          region: input.region || null,
          message: input.message || null,
        });
      }

      await tx.passwordResetToken.create({
        data: { userId: account.id, token, expires: inviteExpiry() },
      });

      return account;
    });

    const url = absoluteUrl(`/accept-invite?token=${token}`);
    const roleLabel = roleLabelFor(input.role, input.preset);

    // The account exists whether or not mail is working. Failing the whole
    // request on a mail error would leave an account created with no way to
    // tell the admin it happened; instead we report exactly what did and did
    // not go out, and the admin still holds a working link either way.
    //
    // `delivered` comes from sendMail rather than from "it didn't throw":
    // with no provider configured it does nothing and returns quite happily,
    // which is how an invite could be reported sent and never arrive.
    const mail = await sendMail({
      to: created.email,
      subject: "Your CarVista account is ready",
      html: accountInviteEmail({
        name: created.name ?? "there",
        url,
        roleLabel,
        invitedBy: (actor.name as string) ?? null,
        expiresInDays: INVITE_EXPIRY_DAYS,
      }),
    });

    return NextResponse.json({
      user: created,
      emailed: mail.delivered,
      mailProblem: mail.delivered ? null : mail.reason,
      inviteUrl: url,
      whatsappUrl: input.phone
        ? inviteWhatsappUrl({ phone: input.phone, name: created.name ?? "there", roleLabel, url })
        : null,
      expiresInDays: INVITE_EXPIRY_DAYS,
    });
  } catch (err) {
    console.error("[admin:users:create]", err);
    return NextResponse.json({ error: "Could not create the account" }, { status: 500 });
  }
}
