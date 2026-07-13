import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { messageSchema } from "@/lib/validations";
import { rateLimit, getClientId } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const limit = rateLimit(`message:${getClientId(req)}`, 15, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many messages. Please slow down." }, { status: 429 });
  }

  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Please sign in to send a message" }, { status: 401 });
  }

  try {
    const parsed = messageSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid message" },
        { status: 400 },
      );
    }
    const { recipientId, subject, body, vehicleId, partId } = parsed.data;

    if (recipientId === user.id) {
      return NextResponse.json({ error: "You can't message yourself" }, { status: 400 });
    }

    await prisma.message.create({
      data: {
        senderId: user.id,
        recipientId,
        subject: subject || null,
        body,
        vehicleId: vehicleId || null,
        partId: partId || null,
      },
    });

    // Notify the recipient.
    await prisma.notification
      .create({
        data: {
          userId: recipientId,
          type: "MESSAGE",
          title: `New message from ${user.name ?? "a buyer"}`,
          body: subject || body.slice(0, 120),
          link: "/dashboard/messages",
        },
      })
      .catch(() => null);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[messages:POST]", error);
    return NextResponse.json({ error: "Could not send your message" }, { status: 500 });
  }
}
