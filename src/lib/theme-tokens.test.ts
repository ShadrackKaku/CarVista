import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Colour tokens must accept an opacity modifier.
 *
 * Tailwind can only compose `bg-success/12` when the token carries the
 * `<alpha-value>` placeholder. Without it the class produces invalid CSS and
 * the element renders with *no background at all* — silently, with no error
 * anywhere, in the browser or the build.
 *
 * That is exactly what had happened: `success` and `warning` were plain
 * `hsl(var(--x))`, and every tinted panel built on them had been invisible.
 * Twenty-odd call sites across escrow, the duty calculators, the admin
 * verification panels and the Badge component were all drawing nothing where
 * they meant to draw a soft green or amber ground.
 */

const ROOT = process.cwd();
const CONFIG = readFileSync(join(ROOT, "tailwind.config.ts"), "utf8");

/** Every `hsl(var(--x) …)` colour declared in the theme. */
function declaredTokens(): { token: string; hasAlpha: boolean }[] {
  const out: { token: string; hasAlpha: boolean }[] = [];
  const re = /"hsl\(var\((--[a-z-]+)\)([^"]*)\)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(CONFIG))) {
    out.push({ token: m[1], hasAlpha: m[2].includes("<alpha-value>") });
  }
  return out;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

describe("theme colour tokens", () => {
  it("all carry the alpha placeholder", () => {
    const missing = declaredTokens()
      .filter((t) => !t.hasAlpha)
      .map((t) => t.token);
    expect(
      missing,
      "these cannot take an opacity modifier — bg-x/50 on them renders transparent",
    ).toEqual([]);
  });

  it("declares the ones the app actually tints", () => {
    // A sanity check that the regex above is finding real entries rather than
    // passing because it matched nothing.
    const tokens = declaredTokens().map((t) => t.token);
    expect(tokens).toContain("--success");
    expect(tokens).toContain("--warning");
    expect(tokens.length).toBeGreaterThan(10);
  });
});

describe("every opacity modifier used in the app resolves", () => {
  it("names a token that can take one", () => {
    const files = walk(join(ROOT, "src"));
    // Colours defined as a fixed scale (brand-100, and Tailwind's own palette)
    // take opacity without any placeholder, so they are not the concern here.
    const semantic = new Set(
      declaredTokens().map((t) => t.token.replace(/^--/, "").replace(/-foreground$/, "")),
    );
    const alphaCapable = new Set(
      declaredTokens()
        .filter((t) => t.hasAlpha)
        .map((t) => t.token.replace(/^--/, "")),
    );

    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      const uses = text.match(/(?:bg|text|border|ring|from|to|via)-([a-z-]+)\/\[?[\d.]+\]?/g) ?? [];
      for (const use of uses) {
        const name = use.replace(/^(?:bg|text|border|ring|from|to|via)-/, "").split("/")[0];
        if (!semantic.has(name)) continue; // a scale colour, or something else
        if (!alphaCapable.has(name)) {
          offenders.push(`${relative(ROOT, file)}: ${use}`);
        }
      }
    }
    expect(offenders, "opacity used on a token that cannot compose it").toEqual([]);
  });
});
