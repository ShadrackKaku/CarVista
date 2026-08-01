#!/usr/bin/env node
/**
 * Responsive regression guard.
 *
 * A page that scrolls sideways is always a bug, and it is invisible to
 * typecheck, lint and the build. We have shipped it four times, every time
 * from the same cause: a CSS grid or flex item defaults to `min-width: auto`,
 * so its content's intrinsic width sizes the track and pushes the whole page
 * out. The fix is always `min-w-0` (or letting the row wrap) — but nothing
 * catches the next one. This does.
 *
 * Usage:
 *   node scripts/check-responsive.mjs [--base http://localhost:3000]
 *
 * Expects a server already running at --base (`npm start` after `npm run
 * build`). Exits non-zero and prints the offending element for each failure.
 *
 * Chromium is resolved from PLAYWRIGHT_BROWSERS_PATH or CHROME_PATH; if no
 * browser is available the check skips with a clear message rather than
 * failing, so it never blocks an environment that cannot run it.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const BASE =
  process.argv.find((a, i) => process.argv[i - 1] === "--base") ??
  process.env.RESPONSIVE_BASE_URL ??
  "http://localhost:3000";

/** Public routes only — the signed-in shell needs a database and a session. */
const ROUTES = [
  "/",
  "/vehicles",
  "/parts",
  "/dealers",
  "/services",
  "/calculators",
  "/calculators/import-duty",
  "/calculators/taxes",
  "/calculators/shipping",
  "/calculators/financing",
  "/import",
  "/login",
  "/register",
];

/** 390 phone · 768 tablet · 1024 the lg boundary · 1280 xl · 1440 desktop. */
const WIDTHS = [390, 768, 1024, 1280, 1440];

let chromium;
try {
  ({ chromium } = await import("playwright-core"));
} catch {
  console.log("· playwright-core not installed — skipping responsive check.");
  process.exit(0);
}

function findChromium() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  // playwright-core already honours PLAYWRIGHT_BROWSERS_PATH and its own
  // default cache, so ask it before guessing at the filesystem.
  try {
    const p = chromium.executablePath();
    if (p && existsSync(p)) return p;
  } catch {
    // Not installed through playwright — fall through to the scan below.
  }
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return null;
  for (const dir of readdirSync(root)) {
    if (!dir.startsWith("chromium") || dir.includes("headless_shell")) continue;
    const candidate = join(root, dir, "chrome-linux", "chrome");
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

const executablePath = findChromium();
if (!executablePath) {
  console.log("· No Chromium found — skipping responsive check.");
  console.log("  Set CHROME_PATH or PLAYWRIGHT_BROWSERS_PATH to enable it.");
  process.exit(0);
}

const res = await fetch(BASE).catch(() => null);
if (!res) {
  console.error(`✗ Nothing is serving ${BASE}. Run \`npm run build && npm start\` first.`);
  process.exit(1);
}

const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
const failures = [];

for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();

  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60_000 });
    // Let images and fonts settle; a late-loading wide element still counts.
    await page.waitForTimeout(900);

    const result = await page.evaluate((viewportWidth) => {
      const doc = document.documentElement;
      if (doc.scrollWidth <= doc.clientWidth + 1) return null;

      // Blame the outermost element that overflows: its children inherit the
      // problem, and anything inside a horizontal scroller is allowed to.
      const insideScroller = (el) => {
        for (let n = el.parentElement; n; n = n.parentElement) {
          const ox = getComputedStyle(n).overflowX;
          if (ox === "auto" || ox === "scroll" || ox === "hidden") return true;
        }
        return false;
      };

      const culprits = [];
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right <= viewportWidth + 1) continue;
        if (insideScroller(el)) continue;
        const parent = el.parentElement?.getBoundingClientRect();
        if (parent && parent.right > viewportWidth + 1) continue;
        culprits.push(
          `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 80)} ` +
            `(w=${Math.round(r.width)}, right=${Math.round(r.right)})`,
        );
      }
      return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, culprits: culprits.slice(0, 3) };
    }, width);

    if (result) {
      failures.push({ width, route, ...result });
      console.error(
        `✗ ${route} @ ${width}px — page is ${result.scrollWidth}px wide in a ${result.clientWidth}px viewport`,
      );
      for (const c of result.culprits) console.error(`    ${c}`);
    }
  }

  await context.close();
}

await browser.close();

const checks = ROUTES.length * WIDTHS.length;
if (failures.length) {
  console.error(
    `\n${failures.length} of ${checks} checks scroll horizontally.` +
      "\nUsually a grid/flex item missing `min-w-0`, or a row that should wrap.",
  );
  process.exit(1);
}

console.log(`✓ No horizontal overflow — ${ROUTES.length} routes × ${WIDTHS.length} widths.`);
