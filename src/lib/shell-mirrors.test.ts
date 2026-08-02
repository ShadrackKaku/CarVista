import { describe, it, expect } from "vitest";
import { shellTwinFor, SHELL_MIRROR_PREFIXES } from "./shell-mirrors";

describe("shellTwinFor", () => {
  it("maps every public marketplace root into the shell", () => {
    expect(shellTwinFor("/vehicles")).toBe("/app/marketplace/vehicles");
    expect(shellTwinFor("/parts")).toBe("/app/marketplace/parts");
    expect(shellTwinFor("/dealers")).toBe("/app/marketplace/dealers");
    expect(shellTwinFor("/services")).toBe("/app/marketplace/services");
    expect(shellTwinFor("/calculators")).toBe("/app/calculators");
  });

  it("carries the slug through on detail pages", () => {
    expect(shellTwinFor("/vehicles/2020-toyota-rav4")).toBe(
      "/app/marketplace/vehicles/2020-toyota-rav4",
    );
    expect(shellTwinFor("/parts/bosch-brake-pads")).toBe("/app/marketplace/parts/bosch-brake-pads");
    expect(shellTwinFor("/dealers/tema-motors")).toBe("/app/marketplace/dealers/tema-motors");
  });

  it("sends the selling routes to the listings module, not to a listing", () => {
    // `/vehicles/new` and `/vehicles/<slug>/edit` are sell-side, so a plain
    // prefix swap would land them on a detail URL that does not exist.
    expect(shellTwinFor("/vehicles/new")).toBe("/app/marketplace/listings/new");
    expect(shellTwinFor("/vehicles/2020-toyota-rav4/edit")).toBe(
      "/app/marketplace/listings/2020-toyota-rav4/edit",
    );
  });

  it("maps the import flow", () => {
    // `/import` keeps a public page that explains the service, so it is not in
    // the "leave alone" set below — a signed-in visitor is moved on to the
    // module instead, exactly as `/calculators` is.
    expect(shellTwinFor("/import")).toBe("/app/imports");
    expect(shellTwinFor("/import/track")).toBe("/app/imports/track");
    expect(shellTwinFor("/import/duty-check")).toBe("/app/imports/duty-check");
    expect(shellTwinFor("/import/escrow/verify")).toBe("/app/imports/escrow/verify");
  });

  it("maps global search", () => {
    expect(shellTwinFor("/search")).toBe("/app/search");
  });

  it("maps the buying flow", () => {
    expect(shellTwinFor("/cart")).toBe("/app/marketplace/cart");
    expect(shellTwinFor("/checkout")).toBe("/app/marketplace/checkout");
    expect(shellTwinFor("/checkout/verify")).toBe("/app/marketplace/checkout/verify");
  });

  it("leaves the marketing site alone", () => {
    // These explain the product rather than being it, so they stay public for
    // everyone — a signed-in user following a link to /about should read it.
    for (const path of [
      "/",
      "/about",
      "/contact",
      "/faq",
      "/blog",
      "/blog/a-post",
      "/features",
      "/pricing",
      "/resources",
      "/terms",
      "/privacy",
    ]) {
      expect(shellTwinFor(path)).toBeNull();
    }
  });

  it("never chains — a shell path has no twin of its own", () => {
    // Without this the redirect would bounce between two /app URLs forever.
    for (const path of ["/app", "/app/marketplace", "/app/marketplace/vehicles", "/app/calculators"]) {
      expect(shellTwinFor(path)).toBeNull();
    }
  });

  it("does not match a sibling that merely shares a prefix", () => {
    expect(shellTwinFor("/vehicles-for-hire")).toBeNull();
    expect(shellTwinFor("/parts-catalogue")).toBeNull();
  });

  it("exports every mirrored prefix, so the matcher can't drift from the map", () => {
    for (const prefix of SHELL_MIRROR_PREFIXES) {
      expect(shellTwinFor(prefix)).not.toBeNull();
    }
  });
});

describe("the config redirects agree with the mirror map", () => {
  /**
   * Two mechanisms move a visitor into the shell, and they must not disagree.
   *
   * `next.config.mjs` owns URLs that moved and left no public page — a real 308
   * before any rendering. The mirror map owns URLs that still have a public
   * page but a twin inside the shell. A URL handled by the config that the map
   * would send somewhere else is a bug that only shows up as a user landing on
   * the wrong page.
   */
  it("sends every moved URL where shellTwinFor would send it", async () => {
    const config = (await import("../../next.config.mjs")).default;
    // `redirects` is optional on NextConfig; ours defines it, and this
    // fails loudly rather than silently checking nothing if that changes.
    expect(config.redirects).toBeTypeOf("function");
    // Next's Redirect type allows `statusCode` instead of `permanent`; every
    // rule here uses `permanent`, and the second test below holds that.
    const rules: { source: string; destination: string; permanent?: boolean }[] =
      await config.redirects!();

    // Only the public sources: the map answers "a signed-in visitor is on a
    // public URL — where should they be?". A `/dashboard/*` rule is an
    // in-app move, already behind the auth guard, and has no place in it.
    const movedIntoShell = rules.filter(
      (r) => r.destination.startsWith("/app/") && !r.source.startsWith("/dashboard/"),
    );
    // Guard the test: if the rules ever stop being found, this must fail loudly
    // rather than pass over an empty list.
    expect(movedIntoShell.length).toBeGreaterThan(7);

    for (const rule of movedIntoShell) {
      // `:slug` and `:id` are Next's path params; substitute a value so the
      // same string can be run through the map.
      const source = rule.source.replace(/:[a-zA-Z]+/g, "x");
      const destination = rule.destination.replace(/:[a-zA-Z]+/g, "x");
      expect(shellTwinFor(source), `mirror disagrees for ${rule.source}`).toBe(destination);
    }
  });

  it("makes every moved redirect permanent", () => {
    // These are not temporary. A 307 would leave the old URL in the index.
    return import("../../next.config.mjs").then(async ({ default: config }) => {
      const rules = await config.redirects!();
      for (const rule of rules.filter((r: { destination: string }) =>
        r.destination.startsWith("/app/"),
      )) {
        expect(rule.permanent).toBe(true);
      }
    });
  });
});
