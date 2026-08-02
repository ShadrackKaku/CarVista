import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { supplierEnquiryReplySchema } from "@/lib/validations";
import { isAdmin } from "@/lib/roles";

/**
 * PATCH /api/supplier-enquiries/[id] — the supplier answers.
 *
 * Only the supplier the enquiry was addressed to may reply. Ownership is read
 * from the row rather than taken from the request, so knowing an id is not
 * enough to answer on someone else's behalf.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  }

  const parsed = supplierEnquiryReplySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid reply" },
      { status: 400 },
    );
  }

  try {
    const enquiry = await prisma.supplierEnquiry.findUnique({
      where: { id: params.id },
      include: { supplier: { select: { userId: true } } },
    });
    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }
    if (enquiry.supplier.userId !== user.id && !isAdmin(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.supplierEnquiry.update({
      where: { id: enquiry.id },
      data: {
        status: parsed.data.status,
        response: parsed.data.response || null,
        respondedAt: new Date(),
      },
    });
    return NextResponse.json({ enquiry: updated });
  } catch (error) {
    console.error("[supplier-enquiries:PATCH]", error);
    return NextResponse.json({ error: "Could not save your reply" }, { status: 500 });
  }
}
