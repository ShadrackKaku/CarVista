import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { rateLimit, getClientId } from "@/lib/rate-limit";
import { sendMail, verificationEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/utils";
import { UserRole } from "@prisma/client";

export async function POST(req: Request) {
  const limit = rateLimit(`register:${getClientId(req)}`, 5, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { name, email, phone, password, role } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone: phone || null,
        hashedPassword,
        role: role as UserRole,
      },
    });

    // Email verification token
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendMail({
      to: normalizedEmail,
      subject: "Verify your CarVista email",
      html: verificationEmail(name, absoluteUrl(`/verify-email?token=${token}`)),
    });

    return NextResponse.json(
      { success: true, message: "Account created. Check your email to verify." },
      { status: 201 },
    );
  } catch (error) {
    console.error("[register]", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
