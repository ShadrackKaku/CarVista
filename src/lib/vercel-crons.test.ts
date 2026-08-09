import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

/**
 * Cron schedules Vercel will actually accept.
 *
 * A schedule the plan disallows is rejected at *deploy* time, before the build
 * runs — so typecheck, lint, tests and `next build` all pass locally and in CI,
 * and the first sign of trouble is a failed deployment with no build log to
 * read. That is a bad way to find out, and it is exactly what happened when the
 * reservations sweep was first added hourly.
 *
 * Vercel's Hobby plan allows at most two cron jobs, each running at most once
 * per day. This asserts the stricter Hobby limits rather than the Pro ones: a
 * repo that deploys on the free tier is the safe default, and loosening this
 * should be a deliberate edit made at the same time as the plan changes.
 */
const vercelConfig = JSON.parse(
  readFileSync(join(process.cwd(), "vercel.json"), "utf8"),
) as { crons?: Array<{ path: string; schedule: string }> };

const crons = vercelConfig.crons ?? [];

/** Every field of a 5-field cron expression, in order. */
function fields(schedule: string): string[] {
  return schedule.trim().split(/\s+/);
}

describe("vercel cron schedules", () => {
  it("has at most the two jobs a Hobby plan allows", () => {
    expect(crons.length).toBeLessThanOrEqual(2);
  });

  it("uses well-formed five-field expressions", () => {
    for (const cron of crons) {
      expect(fields(cron.schedule), cron.path).toHaveLength(5);
    }
  });

  it("fires no more than once a day", () => {
    // The minute and hour fields must each name a single value. A wildcard or
    // a step in either ("0 * * * *", "*/15 * * * *") means several runs a day,
    // which the free tier rejects outright.
    for (const cron of crons) {
      const [minute, hour] = fields(cron.schedule);
      expect(minute, `${cron.path} minute`).toMatch(/^\d+$/);
      expect(hour, `${cron.path} hour`).toMatch(/^\d+$/);
    }
  });

  it("points every job at a route that exists", () => {
    // A cron aimed at a deleted route fails silently in production — Vercel
    // calls it, gets a 404, and nothing tells you the sweep stopped running.
    for (const cron of crons) {
      const route = join(process.cwd(), "src", "app", cron.path, "route.ts");
      expect(() => readFileSync(route), `${cron.path} has no route.ts`).not.toThrow();
    }
  });
});
