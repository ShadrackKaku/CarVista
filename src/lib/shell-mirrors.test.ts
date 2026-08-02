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

  it("maps the buying flow", () => {
    expect(shellTwinFor("/cart")).toBe("/app/marketplace/cart");
    expect(shellTwinFor("/checkout")).toBe("/app/marketplace/checkout");
    expect(shellTwinFor("/checkout/verify")).toBe("/app/marketplace/checkout/verify");
  });

  it("leaves the marketing site alone", () => {
    // These explain the product rather than being it, so they stay public for
    // everyone — a signed-in user following a link to /about should read it.
    for (const path of ["/", "/about", "/contact", "/faq", "/blog", "/blog/a-post", "/import", "/terms"]) {
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
