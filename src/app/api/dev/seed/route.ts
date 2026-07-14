import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedCatalog } from "@/lib/seed/catalog";

export const dynamic = "force-dynamic";
// Seeding does many DB round-trips; allow more than the default budget.
export const maxDuration = 60;

/**
 * One-off catalogue seeder.
 *
 * Disabled unless the `SEED_SECRET` env var is set, and requires that same
 * secret on every call (header `x-seed-secret` or `?secret=`). Idempotent —
 * safe to hit more than once. Remove SEED_SECRET afterwards to lock it down.
 */
async function handle(req: Request) {
  const secret = process.env.SEED_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Seeding is disabled. Set the SEED_SECRET env var to enable it." },
      { status: 404 },
    );
  }

  const provided =
    req.headers.get("x-seed-secret") ?? new URL(req.url).searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const summary = await seedCatalog(prisma);
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error("[dev:seed]", error);
    return NextResponse.json(
      { error: "Seed failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
