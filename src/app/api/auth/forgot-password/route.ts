import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { rateLimit, getClientId } from "@/lib/rate-limit";
import { sendMail, passwordResetEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/utils";
import { SITE } from "@/lib/constants";

export async function POST(req: Request) {
  const limit = await rateLimit(`forgot:${getClientId(req)}`, 5, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond success to avoid user enumeration.
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expires: new Date(Date.now() + 60 * 60 * 1000) },
      });
      await sendMail({
        to: email,
        subject: `Reset your ${SITE.name} password`,
        html: passwordResetEmail(user.name ?? "there", absoluteUrl(`/reset-password?token=${token}`)),
      });
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("[forgot-password]", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
