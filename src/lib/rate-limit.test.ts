import { describe, it, expect } from "vitest";
import { rateLimit, getClientId } from "@/lib/rate-limit";

// With no UPSTASH_* env, rateLimit uses the in-memory fallback.
describe("rateLimit (in-memory fallback)", () => {
  it("allows up to the limit, then blocks within the window", async () => {
    const id = `test:${Math.random()}`;
    const a = await rateLimit(id, 2, 60_000);
    const b = await rateLimit(id, 2, 60_000);
    const c = await rateLimit(id, 2, 60_000);
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
    expect(c.success).toBe(false);
    expect(c.remaining).toBe(0);
  });

  it("tracks separate identifiers independently", async () => {
    const a = await rateLimit(`x:${Math.random()}`, 1, 60_000);
    const b = await rateLimit(`y:${Math.random()}`, 1, 60_000);
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
  });
});

describe("getClientId", () => {
  it("prefers the first x-forwarded-for IP", () => {
    const req = new Request("https://x.test", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientId(req)).toBe("1.2.3.4");
  });

  it("falls back to anonymous when no IP header is present", () => {
    expect(getClientId(new Request("https://x.test"))).toBe("anonymous");
  });
});
