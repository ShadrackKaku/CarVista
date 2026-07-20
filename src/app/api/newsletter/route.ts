import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/validations";
import { rateLimit, getClientId } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const limit = await rateLimit(`newsletter:${getClientId(req)}`, 10, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const body = await req.json();
    const parsed = newsletterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    }
    const email = parsed.data.email.toLowerCase();
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { active: true },
      create: { email },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[newsletter]", error);
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }
}
