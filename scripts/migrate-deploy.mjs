// Runs `prisma migrate deploy` with retries.
//
// Neon's serverless Postgres auto-suspends its compute after a short idle
// period. The first connection after that triggers a resume that can take a
// few seconds, during which Prisma may fail with `P1001: Can't reach database
// server`. Without retries a routine cold start fails the whole Vercel build.
//
// We retry a handful of times with a growing delay so a sleeping database gets
// a chance to wake. If it is genuinely unreachable, we still exit non-zero
// after the final attempt so we never build against an un-migrated database.
import { execSync } from "node:child_process";

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 3000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    process.exit(0);
  } catch {
    if (attempt === MAX_ATTEMPTS) {
      console.error(
        `\n[migrate] database still unreachable after ${MAX_ATTEMPTS} attempts — failing the build.`,
      );
      process.exit(1);
    }
    const delay = BASE_DELAY_MS * attempt;
    console.error(
      `\n[migrate] attempt ${attempt}/${MAX_ATTEMPTS} failed; retrying in ${delay}ms (waiting for the database to wake)…`,
    );
    await sleep(delay);
  }
}
