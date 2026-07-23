import { NextResponse } from "next/server";
import { runBuyerAlerts } from "@/lib/alerts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/alerts — run buyer alerts (price drops + saved-search matches).
 *
 * Invoked by Vercel Cron (see vercel.json). Vercel automatically sends
 * `Authorization: Bearer <CRON_SECRET>` when the CRON_SECRET env var is set, so
 * we require it — this endpoint must never run for an unauthenticated caller.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runBuyerAlerts();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron:alerts]", error);
    return NextResponse.json({ error: "Alert run failed" }, { status: 500 });
  }
}
