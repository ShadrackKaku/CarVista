import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { inspectionReportSchema } from "@/lib/validations";
import type { BookingStatus } from "@prisma/client";

/**
 * PATCH — attach an inspection report to a booking. Admin only.
 * Defaults the booking to COMPLETED once a report is filed.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const parsed = inspectionReportSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid report" },
        { status: 400 },
      );
    }

    const booking = await prisma.inspectionBooking.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true, bookingNumber: true },
    });
    if (!booking) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
    }

    await prisma.inspectionBooking.update({
      where: { id: booking.id },
      data: {
        overallGrade: parsed.data.overallGrade,
        reportSummary: parsed.data.reportSummary,
        reportUrl: parsed.data.reportUrl || null,
        inspectedAt: new Date(),
        status: (parsed.data.status ?? "COMPLETED") as BookingStatus,
      },
    });

    await prisma.notification
      .create({
        data: {
          userId: booking.userId,
          type: "SYSTEM",
          title: "Your inspection report is ready",
          body: `The report for inspection ${booking.bookingNumber} is now available.`,
          link: "/dashboard/inspections",
        },
      })
      .catch(() => null);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin:inspections:PATCH]", error);
    return NextResponse.json({ error: "Could not save the report" }, { status: 500 });
  }
}
