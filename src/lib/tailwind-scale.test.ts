import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import config from "../../tailwind.config";

/**
 * A Tailwind class outside the configured scale compiles to nothing.
 *
 * Not to a warning, not to a build error — to no CSS at all. `h-4.5 w-4.5` on
 * the checkbox left it with no width, and because `Checkbox` is `shrink-0` with
 * no text inside, every checkbox in the app rendered as an invisible sliver:
 * the filter panel's Condition rows, the blog form, the dealer listings table.
 * Typecheck passed, lint passed, the build passed, and the control was gone.
 *
 * This reads every fractional spacing utility in the source and checks it
 * against the scale that actually exists.
 */
const SRC = join(process.cwd(), "src");

/** Tailwind's built-in fractional steps, plus whatever the config adds. */
const BUILT_IN = new Set(["0.5", "1.5", "2.5", "3.5"]);
const CONFIGURED = new Set([
  ...BUILT_IN,
  ...Object.keys((config.theme?.extend?.spacing ?? {}) as Record<string, string>),
]);

/** Utilities that read the spacing scale and take a bare numeric value. */
const SPACING_UTILITY =
  /\b(?:h|w|min-h|min-w|max-h|max-w|size|p[xytblr]?|-?m[xytblr]?|gap(?:-[xy])?|space-[xy]|inset(?:-[xy])?|top|left|right|bottom|translate-[xy])-(\d+\.\d+)\b/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

describe("Tailwind spacing scale", () => {
  it("uses no fractional step the config does not define", () => {
    const offenders: string[] = [];
    const files = walk(SRC);

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const [match, value] of source.matchAll(SPACING_UTILITY)) {
        if (CONFIGURED.has(value)) continue;
        offenders.push(`${file.slice(SRC.length + 1)} — "${match}"`);
      }
    }

    expect(files.length).toBeGreaterThan(100); // the walk found real files
    expect(
      [...new Set(offenders)],
      "these compile to no CSS at all, so the element silently loses the property",
    ).toEqual([]);
  });

  it("defines the 4.5 step the checkbox depends on", () => {
    // Ten call sites size themselves with it. If it leaves the config, they all
    // collapse again, and nothing else in the suite would notice.
    expect(CONFIGURED.has("4.5")).toBe(true);
    expect((config.theme?.extend?.spacing as Record<string, string>)["4.5"]).toBe("1.125rem");
  });
});
