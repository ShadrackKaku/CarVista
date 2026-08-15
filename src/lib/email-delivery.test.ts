import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isMailConfigured, sendMail } from "./email";

/**
 * Whether an email was actually sent.
 *
 * `sendMail` used to return void and returned it just as happily when it had
 * done nothing: with no provider configured it wrote a line to the console and
 * came back clean. Every caller read that as success — so password resets,
 * verification mail, order confirmations and admin invites all reported
 * themselves sent on a deployment with no mail provider, and the only symptom
 * was that nobody ever received anything.
 */

const ENV = { ...process.env };

function clearMailEnv() {
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_SERVER_HOST;
  delete process.env.EMAIL_SERVER_USER;
  delete process.env.EMAIL_SERVER_PASSWORD;
}

beforeEach(() => {
  clearMailEnv();
  vi.restoreAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  process.env = { ...ENV };
});

const message = { to: "someone@example.com", subject: "Hello", html: "<p>hi</p>" };

describe("with no provider configured", () => {
  it("reports the message as NOT delivered", async () => {
    // The bug in one line. Anything that treats "it didn't throw" as success
    // is wrong here, because nothing was sent.
    const result = await sendMail(message);
    expect(result).toEqual({ delivered: false, reason: "not-configured" });
  });

  it("says so through isMailConfigured", () => {
    expect(isMailConfigured()).toBe(false);
    process.env.RESEND_API_KEY = "re_test";
    expect(isMailConfigured()).toBe(true);
  });

  it("complains loudly in production, quietly in development", async () => {
    // In development an unconfigured mailer is normal. In production it means
    // no customer is receiving anything, and it has to be findable in the logs.
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const prev = process.env.NODE_ENV;
    Object.defineProperty(process.env, "NODE_ENV", { value: "production", configurable: true });
    await sendMail(message);
    expect(err).toHaveBeenCalled();
    expect(String(err.mock.calls[0][0])).toMatch(/No provider configured/);
    Object.defineProperty(process.env, "NODE_ENV", { value: prev, configurable: true });
  });

  it("never throws, so a failed email cannot break the thing it accompanies", async () => {
    // A paid order must not 500 because its confirmation mail could not go.
    await expect(sendMail(message)).resolves.toBeTruthy();
  });
});

describe("with Resend configured", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test";
  });

  it("reports delivery when Resend accepts it", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    expect(await sendMail(message)).toEqual({ delivered: true, via: "resend" });
  });

  it("reports failure — not success — when Resend rejects it", async () => {
    // The second half of the same bug: a configured provider that errors used
    // to fall through to the console log and return as though it had worked.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("domain not verified", { status: 403 })),
    );
    const result = await sendMail(message);
    expect(result.delivered).toBe(false);
    expect(result).toMatchObject({ reason: "failed" });
    expect((result as { detail?: string }).detail).toMatch(/403/);
  });

  it("reports failure when the request itself blows up", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    const result = await sendMail(message);
    expect(result).toMatchObject({ delivered: false, reason: "failed" });
  });
});

describe("what the callers do with it", () => {
  it("the invite route reports delivery from sendMail, not from the absence of a throw", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const source = readFileSync(
      join(process.cwd(), "src/app/api/admin/users/route.ts"),
      "utf8",
    );
    expect(source).toMatch(/emailed:\s*mail\.delivered/);
    // And it tells the admin why, so "the invite never arrived" is diagnosable
    // from the screen rather than from the server logs.
    expect(source).toMatch(/mailProblem/);
  });
});

describe("links that have to work from someone else's inbox", () => {
  const ENV_URL = { ...process.env };
  afterEach(() => {
    process.env = { ...ENV_URL };
  });

  it("prefers the explicitly configured URL", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    const { absoluteUrl } = await import("./utils");
    expect(absoluteUrl("/accept-invite?token=x")).toBe(
      "https://example.com/accept-invite?token=x",
    );
  });

  it("works on Vercel with nothing configured", async () => {
    // The failure this prevents: a deployment with no NEXT_PUBLIC_APP_URL used
    // to email every recipient a link to http://localhost:3000, which is their
    // own machine and has nothing on it.
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "example.vercel.app";
    const { absoluteUrl } = await import("./utils");
    expect(absoluteUrl("/reset-password")).toBe("https://example.vercel.app/reset-password");
  });

  it("falls back to the deployment URL when there is no production domain", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    process.env.VERCEL_URL = "example-abc123.vercel.app";
    const { absoluteUrl } = await import("./utils");
    expect(absoluteUrl("/x")).toBe("https://example-abc123.vercel.app/x");
  });

  it("does not double the slash", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com/";
    const { absoluteUrl } = await import("./utils");
    expect(absoluteUrl("/a")).toBe("https://example.com/a");
  });
});
