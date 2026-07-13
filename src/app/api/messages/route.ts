import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { messageSchema } from "@/lib/validations";
import { rateLimit, getClientId } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const limit = rateLimit(`message:${getClientId(req)}`, 20, 60_000);
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
    const { conversationId, recipientId, subject, body, vehicleId, partId } = parsed.data;

    let convo:
      | { id: string; buyerId: string; sellerId: string }
      | null = null;

    if (conversationId) {
      // ── Reply flow: user must be a participant of the conversation.
      convo = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { id: true, buyerId: true, sellerId: true },
      });
      if (!convo || (convo.buyerId !== user.id && convo.sellerId !== user.id)) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
    } else {
      // ── Start flow: create (or reuse) a thread with the recipient.
      if (recipientId === user.id) {
        return NextResponse.json({ error: "You can't message yourself" }, { status: 400 });
      }
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId! },
        select: { id: true },
      });
      if (!recipient) {
        return NextResponse.json({ error: "That seller is no longer available" }, { status: 404 });
      }
      // Reuse an existing thread for the same buyer/seller/context to avoid duplicates.
      convo =
        (await prisma.conversation.findFirst({
          where: {
            buyerId: user.id,
            sellerId: recipientId!,
            vehicleId: vehicleId || null,
            partId: partId || null,
          },
          select: { id: true, buyerId: true, sellerId: true },
        })) ??
        (await prisma.conversation.create({
          data: {
            buyerId: user.id,
            sellerId: recipientId!,
            vehicleId: vehicleId || null,
            partId: partId || null,
            subject: subject || null,
          },
          select: { id: true, buyerId: true, sellerId: true },
        }));
    }

    const otherPartyId = convo.buyerId === user.id ? convo.sellerId : convo.buyerId;

    await prisma.$transaction([
      prisma.message.create({
        data: { conversationId: convo.id, senderId: user.id, body },
      }),
      prisma.conversation.update({
        where: { id: convo.id },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    // Notify the other participant.
    await prisma.notification
      .create({
        data: {
          userId: otherPartyId,
          type: "MESSAGE",
          title: `New message from ${user.name ?? "a CarVista member"}`,
          body: body.slice(0, 120),
          link: `/dashboard/messages/${convo.id}`,
        },
      })
      .catch(() => null);

    return NextResponse.json({ success: true, conversationId: convo.id }, { status: 201 });
  } catch (error) {
    console.error("[messages:POST]", error);
    return NextResponse.json({ error: "Could not send your message" }, { status: 500 });
  }
}
