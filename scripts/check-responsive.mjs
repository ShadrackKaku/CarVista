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

/**
 * Public routes only — the signed-in shell needs a database and a session.
 *
 * The four deep calculator URLs used to be listed here. They now 301 to
 * `/calculators` (the tools themselves moved into the authenticated app), so
 * measuring them would just measure that one page five more times.
 */
const ROUTES = [
  "/",
  "/vehicles",
  "/parts",
  "/dealers",
  "/services",
  "/calculators",
  "/import",
  "/import/duty-check",
  "/about",
  "/contact",
  "/faq",
  "/blog",
  "/login",
  "/register",
];

/** 390 phone · 768 tablet · 1024 the lg boundary · 1280 xl · 1440 desktop. */
const WIDTHS = [390, 768, 1024, 1280, 1440];

let chromium;
try {
  ({ chromium } = await import("playwright-core"));
} catch {
  console.error("✗ playwright-core is not installed, so nothing was checked.");
  console.error("  Run `npm ci`, or set RESPONSIVE_ALLOW_SKIP=1 to skip.");
  process.exit(process.env.RESPONSIVE_ALLOW_SKIP === "1" ? 0 : 1);
}

/** Every place a Chromium or headless-shell binary might live. */
function findChromium() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  // playwright-core honours PLAYWRIGHT_BROWSERS_PATH and its own cache, but
  // only for the browser revision *it* was built against — a CLI of a
  // different version installs a different revision directory, which this
  // misses. Hence the scan below.
  try {
    const p = chromium.executablePath();
    if (p && existsSync(p)) return p;
  } catch {
    // Not installed through playwright — fall through.
  }
  const roots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    join(process.env.HOME ?? "", ".cache", "ms-playwright"),
  ].filter((r) => r && existsSync(r));

  for (const root of roots) {
    for (const dir of readdirSync(root)) {
      if (!dir.startsWith("chromium")) continue;
      // Full Chromium ships `chrome`; the headless shell ships
      // `headless_shell`. Either drives the page fine.
      for (const bin of ["chrome", "headless_shell"]) {
        const candidate = join(root, dir, "chrome-linux", bin);
        if (existsSync(candidate)) return candidate;
      }
    }
  }
  return null;
}

const executablePath = findChromium();
if (!executablePath) {
  // Skipping must be opt-in. A guard that silently reports success when it
  // cannot run is worse than no guard: CI goes green having checked nothing.
  if (process.env.RESPONSIVE_ALLOW_SKIP === "1") {
    console.log("· No Chromium found — skipping (RESPONSIVE_ALLOW_SKIP=1).");
    process.exit(0);
  }
  console.error("✗ No Chromium found, so nothing was checked.");
  console.error("  Install one with `npx playwright install chromium`, or set CHROME_PATH.");
  console.error("  Set RESPONSIVE_ALLOW_SKIP=1 to make this a skip instead of a failure.");
  process.exit(1);
}
console.log(`· Driving ${executablePath}`);

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
    // Short per-page budget: a wedged route should fail fast and name itself,
    // not stall the run for a minute apiece across 65 loads.
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 20_000 });
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
