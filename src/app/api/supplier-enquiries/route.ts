import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { supplierEnquirySchema } from "@/lib/validations";

/** POST /api/supplier-enquiries — ask a supplier to quote. */
export async function POST(req: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Please sign in to send an enquiry" }, { status: 401 });
  }

  const parsed = supplierEnquirySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid enquiry" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: d.supplierId },
      select: { id: true, userId: true },
    });
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }
    // Quoting yourself is not a thing, and it would put noise in your own queue.
    if (supplier.userId === user.id) {
      return NextResponse.json({ error: "That's your own listing" }, { status: 409 });
    }

    const enquiry = await prisma.supplierEnquiry.create({
      data: {
        supplierId: supplier.id,
        buyerId: user.id,
        item: d.item,
        quantity: d.quantity || null,
        category: d.category || null,
        message: d.message || null,
      },
    });
    return NextResponse.json({ enquiry }, { status: 201 });
  } catch (error) {
    console.error("[supplier-enquiries:POST]", error);
    return NextResponse.json({ error: "Could not send your enquiry" }, { status: 500 });
  }
}
