import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { importRequestSchema } from "@/lib/validations";
import { generateReference } from "@/lib/utils";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to request an import" },
      { status: 401 },
    );
  }
  try {
    const body = await req.json();
    const parsed = importRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const request = await prisma.importRequest.create({
      data: {
        requestNumber: generateReference("IMP"),
        userId: user.id,
        countryOfOrigin: d.countryOfOrigin,
        auctionSource: d.auctionSource || null,
        make: d.make,
        model: d.model,
        year: d.year,
        budget: d.budget ? new Prisma.Decimal(d.budget) : null,
        fuelType: d.fuelType,
        transmission: d.transmission,
        color: d.color || null,
        auctionLink: d.auctionLink || null,
        notes: d.notes || null,
        stage: "REQUESTED",
        trackingEvents: {
          create: {
            stage: "REQUESTED",
            title: "Import request received",
            description: "Our team will review your request and send a quotation shortly.",
          },
        },
      },
    });
    return NextResponse.json({ request }, { status: 201 });
  } catch (error) {
    console.error("[import-requests]", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
