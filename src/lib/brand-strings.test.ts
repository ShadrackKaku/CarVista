import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { SITE, APP_KEY, enumLabel } from "./constants";

/**
 * The product name lives in exactly one place.
 *
 * Renaming a product is not an interesting engineering problem, but it is an
 * expensive one when the name is typed into a hundred headings, emails and page
 * titles: every occurrence is a chance to miss one, and the ones that get
 * missed are the ones customers see. This suite makes the rename a one-line
 * edit and keeps it that way.
 */

const SRC = join(process.cwd(), "src");
const BRAND = "CarVista";

/** Files that are allowed to spell the brand out. */
const ALLOWED = new Set([
  "lib/constants.ts", // defines it
  "lib/brand-strings.test.ts", // this file
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const files = walk(SRC).map((f) => ({
  path: relative(SRC, f).split("\\").join("/"),
  text: readFileSync(f, "utf8"),
}));

describe("the product name", () => {
  it("is written out in exactly one file", () => {
    const offenders = files
      .filter((f) => !ALLOWED.has(f.path))
      .filter((f) => f.text.includes(BRAND))
      .map((f) => {
        const line = f.text.split("\n").findIndex((l) => l.includes(BRAND)) + 1;
        return `${f.path}:${line}`;
      });

    // If this fails you have typed the brand somewhere instead of reading it.
    // Use SITE.name — in JSX `{SITE.name}`, in a string a template literal.
    expect(offenders, `hardcoded "${BRAND}" — use SITE.name instead`).toEqual([]);
  });

  it("is readable from the constant", () => {
    expect(SITE.name).toBeTruthy();
    expect(SITE.name.trim()).toBe(SITE.name);
  });
});

describe("addresses", () => {
  it("are built on SITE.domain rather than typed out", () => {
    // A rename that leaves support@old-domain in an email footer is worse than
    // no rename: the address bounces and the customer thinks nobody is there.
    const offenders = files
      .filter((f) => !ALLOWED.has(f.path))
      .filter((f) => /@[a-z0-9-]*\.?carvista\.com\.gh/i.test(f.text))
      .map((f) => f.path);

    expect(offenders, "hardcoded email domain — use SITE.domain").toEqual([]);
  });

  it("derives the support address from the domain", () => {
    expect(SITE.supportEmail).toContain(SITE.domain);
  });
});

describe("storage and event keys", () => {
  it("are deliberately NOT tied to the brand name", () => {
    // These address data already sitting in people's browsers. Deriving them
    // from SITE.name would mean a rename silently empties every existing
    // user's cart and wishlist — a migration disguised as a marketing change.
    const constants = files.find((f) => f.path === "lib/constants.ts")!.text;
    expect(APP_KEY).toBe("carvista");
    expect(constants).toMatch(/frozen string rather than derived/i);
  });

  it("are all built from the one namespace", () => {
    const offenders = files
      .filter((f) => !ALLOWED.has(f.path))
      // A bare "carvista" prefix in a key or event name, not part of a domain.
      .filter((f) => /["'`]carvista[:-]/i.test(f.text))
      .map((f) => f.path);

    expect(offenders, "hardcoded key prefix — use APP_KEY").toEqual([]);
  });
});

describe("enum labels", () => {
  it("spell the acronyms the way a person writes them", () => {
    // "Cvt" and "Suv" on a page asking for GH₵289,000 read as carelessness.
    // They came from lower-casing the enum and leaning on CSS `capitalize`,
    // which is fine for PETROL and wrong for every acronym.
    expect(enumLabel("CVT")).toBe("CVT");
    expect(enumLabel("SUV")).toBe("SUV");
    expect(enumLabel("PLUGIN_HYBRID")).toBe("Plug-in Hybrid");
    expect(enumLabel("FOREIGN_USED")).toBe("Foreign Used");
    expect(enumLabel("PETROL")).toBe("Petrol");
  });

  it("renders an untabulated value plainly rather than breaking", () => {
    expect(enumLabel("SOMETHING_NEW")).toBe("SOMETHING_NEW");
    expect(enumLabel(null)).toBe("");
  });

  it("is what the vehicle page uses, so the fix cannot regress", () => {
    const detail = files.find((f) => f.path === "components/vehicles/vehicle-detail.tsx")!.text;
    expect(detail).toMatch(/enumLabel\(vehicle\.transmission\)/);
    expect(detail).not.toMatch(/vehicle\.(fuelType|transmission|bodyType)\.toLowerCase\(\)/);
  });
});
