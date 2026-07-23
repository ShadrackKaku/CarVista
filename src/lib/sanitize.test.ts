import { describe, it, expect } from "vitest";
import { sanitizeRichHtml, stripHtml } from "./sanitize";

describe("stripHtml", () => {
  it("returns collapsed plain text from HTML", () => {
    expect(stripHtml("<p>Hello <strong>world</strong></p><p>Second line</p>")).toBe(
      "Hello world Second line",
    );
  });
  it("handles empty and tag-only input", () => {
    expect(stripHtml("")).toBe("");
    expect(stripHtml("<p></p>")).toBe("");
  });
});

describe("sanitizeRichHtml", () => {
  it("keeps allowed formatting tags", () => {
    const html = "<h2>Title</h2><p>Some <strong>bold</strong> and <em>italic</em> text.</p><ul><li>one</li></ul>";
    expect(sanitizeRichHtml(html)).toBe(html);
  });

  it("strips <script> and its contents", () => {
    const out = sanitizeRichHtml('<p>hi</p><script>alert(1)</script>');
    expect(out).toBe("<p>hi</p>");
    expect(out).not.toContain("script");
  });

  it("removes event-handler and style attributes", () => {
    const out = sanitizeRichHtml('<p onclick="steal()" style="color:red">x</p>');
    expect(out).toBe("<p>x</p>");
  });

  it("drops javascript: links but keeps http/mailto links with safe rel/target", () => {
    expect(sanitizeRichHtml('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:");
    const safe = sanitizeRichHtml('<a href="https://example.com">x</a>');
    expect(safe).toContain('href="https://example.com"');
    expect(safe).toContain('rel="noopener noreferrer nofollow"');
    expect(safe).toContain('target="_blank"');
  });

  it("strips disallowed tags like iframe/img while keeping text", () => {
    expect(sanitizeRichHtml('<iframe src="evil"></iframe><p>ok</p>')).toBe("<p>ok</p>");
    expect(sanitizeRichHtml('<img src=x onerror=alert(1)><p>ok</p>')).toBe("<p>ok</p>");
  });
});
