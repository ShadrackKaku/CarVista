import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedCatalog } from "@/lib/seed/catalog";

export const dynamic = "force-dynamic";
// Seeding does many DB round-trips; allow more than the default budget.
export const maxDuration = 60;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isConnectionError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  // Neon serverless can return P1001 while the compute is waking from sleep.
  return /P1001|Can't reach database server|Connection refused|ECONNRESET/i.test(msg);
}

/** Ping the DB, retrying while a suspended Neon compute wakes up. */
async function waitForDb(retries = 6, baseDelayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (e) {
      if (attempt === retries || !isConnectionError(e)) throw e;
      await sleep(baseDelayMs * attempt);
    }
  }
}

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
    // Wake the database first so a cold Neon compute doesn't fail the seed.
    await waitForDb();

    // The seed is idempotent, so retry the whole run once if the connection
    // drops partway (it resumes where it left off).
    let summary;
    try {
      summary = await seedCatalog(prisma);
    } catch (e) {
      if (!isConnectionError(e)) throw e;
      await waitForDb();
      summary = await seedCatalog(prisma);
    }

    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error("[dev:seed]", error);
    return NextResponse.json(
      {
        error: "Seed failed",
        detail: error instanceof Error ? error.message : String(error),
        hint: "If this mentions P1001 / 'reach database server', the DB was waking — just hit this URL again.",
      },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
