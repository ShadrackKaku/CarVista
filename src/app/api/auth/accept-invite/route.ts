import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations";
import { rateLimit, getClientId } from "@/lib/rate-limit";
import { SITE } from "@/lib/constants";

/**
 * POST /api/auth/accept-invite — set the password on an account an
 * administrator created, using the single-use link that was emailed.
 *
 * Shares the token table with password reset because it is the same proof:
 * holding a secret sent to that address. It is a separate route because the
 * consequences differ — accepting an invite also verifies the email (the token
 * went there and came back, which is exactly what verification means) and marks
 * the account usable for the first time.
 */
export async function POST(req: Request) {
  // Rate limited on the same footing as password reset: the token is 32 random
  // bytes, but an unthrottled endpoint is still a free oracle.
  const limit = await rateLimit(`invite:${getClientId(req)}`, 10, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  try {
    const parsed = resetPasswordSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { token, password } = parsed.data;
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true, hashedPassword: true, status: true } } },
    });

    if (!record || record.expires < new Date()) {
      return NextResponse.json(
        { error: "This invitation link is invalid or has expired. Ask for a new one." },
        { status: 400 },
      );
    }

    if (record.user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: `This account is suspended. Contact ${SITE.name}.` },
        { status: 403 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: {
          hashedPassword,
          // The token was delivered to that address and came back, which is the
          // same evidence the verification mail collects. Making them verify
          // separately would be asking them to prove it twice.
          emailVerified: new Date(),
        },
      }),
      // Every outstanding token for this account, not just the one used — a
      // second invite sent because the first "didn't arrive" must not stay live
      // as a way in after the account is set up.
      prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
    ]);

    return NextResponse.json({
      success: true,
      email: record.user.email,
      message: "Your password is set. You can sign in now.",
    });
  } catch (error) {
    console.error("[accept-invite]", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
