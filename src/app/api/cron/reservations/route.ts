import { NextResponse } from "next/server";
import { expireLapsedReservations } from "@/lib/expire-reservations";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/reservations — release holds whose two working days are up.
 *
 * Runs hourly rather than daily: a reservation bought at 09:00 expires at 09:00
 * two working days later, and a daily sweep would hand the buyer anything up to
 * a day of window they did not pay for, while the importer's unit sat frozen.
 *
 * Same auth as every other cron here — Vercel sends the bearer token, and this
 * endpoint refunds money, so it must never run for an unauthenticated caller.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await expireLapsedReservations();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron:reservations]", error);
    return NextResponse.json({ error: "Sweep failed" }, { status: 500 });
  }
}
