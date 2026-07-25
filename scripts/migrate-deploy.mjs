// Runs `prisma migrate deploy` resiliently for serverless Postgres (Neon).
//
// Neon auto-suspends its compute after a short idle period. The first
// connection after that triggers a resume that can take several seconds — and
// Prisma's default connection timeout is only ~5s, so a routine cold start
// fails the whole Vercel build with either `P1001 (Can't reach database
// server)` or `P1002 (server was reached but timed out)`.
//
// Two defences:
//   1. We connect with a generous `connect_timeout` so a resuming database is
//      given time to answer instead of being abandoned after a few seconds.
//   2. We retry connection-level failures a handful of times with a growing
//      delay, giving the compute more time to wake between attempts.
//
// Deterministic failures (a failed/ conflicting migration, schema drift, bad
// credentials) are NOT retried — retrying can't fix them, and doing so only
// buries the real error under misleading "waiting for the database" noise. We
// surface those immediately with a pointer to the fix.
//
// Migrations run against `DIRECT_URL` when set (Neon's direct, unpooled
// endpoint — the recommended target for migrations), otherwise `DATABASE_URL`.
import { execSync } from "node:child_process";

const MAX_ATTEMPTS = 6;
const BASE_DELAY_MS = 4000;
// How long (seconds) to wait for the database to accept a connection. Neon cold
// starts are usually a few seconds but can spike; 30s comfortably absorbs that.
const CONNECT_TIMEOUT_S = 30;

// Prisma error codes that mean "the database wasn't reachable in time" — i.e.
// a cold start worth waiting out. Anything else is a real, deterministic error.
const TRANSIENT_CODES = ["P1001", "P1002", "P1008", "P1017"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Ensure the connection string carries a generous `connect_timeout` so a
 *  resuming Neon compute isn't abandoned after the ~5s default. Leaves an
 *  explicit timeout already present in the URL untouched. */
function withConnectTimeout(rawUrl) {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", String(CONNECT_TIMEOUT_S));
    }
    return url.toString();
  } catch {
    // Not a parseable URL (unusual) — hand it back unchanged rather than break.
    return rawUrl;
  }
}

const source = process.env.DIRECT_URL || process.env.DATABASE_URL;
// Feed the beefed-up URL to the CLI via DATABASE_URL: the schema's datasource
// reads env("DATABASE_URL"), so overriding it here targets the right database
// with the right timeout without touching schema.prisma.
const childEnv = { ...process.env, DATABASE_URL: withConnectTimeout(source) };

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  try {
    // Capture output (rather than inherit) so we can read Prisma's error code
    // and decide whether the failure is a retryable cold start; we echo it so
    // the build log still shows exactly what Prisma reported.
    const stdout = execSync("npx prisma migrate deploy", {
      env: childEnv,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (stdout) process.stdout.write(stdout);
    process.exit(0);
  } catch (error) {
    const stdout = error?.stdout ?? "";
    const stderr = error?.stderr ?? "";
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    const output = `${stdout}${stderr}${error?.message ?? ""}`;
    const isTransient = TRANSIENT_CODES.some((code) => output.includes(code));

    if (!isTransient) {
      // A deterministic failure — retrying will not help. Fail fast, loudly.
      console.error(
        "\n[migrate] `prisma migrate deploy` failed with a non-connection error.\n" +
          "[migrate] This is NOT a cold start — retrying won't fix it. Check the error above.\n" +
          "[migrate] Common causes: a failed/interrupted migration (P3009), schema drift\n" +
          "[migrate] (P3005), or bad credentials. Inspect with `prisma migrate status` and,\n" +
          "[migrate] if a migration is stuck, resolve it with `prisma migrate resolve`.",
      );
      process.exit(1);
    }

    if (attempt === MAX_ATTEMPTS) {
      console.error(
        `\n[migrate] database still unreachable after ${MAX_ATTEMPTS} attempts — failing the build.`,
      );
      process.exit(1);
    }

    const delay = BASE_DELAY_MS * attempt;
    console.error(
      `\n[migrate] attempt ${attempt}/${MAX_ATTEMPTS}: database not reachable yet (cold start?); retrying in ${delay}ms…`,
    );
    await sleep(delay);
  }
}
