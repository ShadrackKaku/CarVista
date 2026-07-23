import { describe, it, expect } from "vitest";
import { sanitizeBlogHtml } from "./sanitize";

describe("sanitizeBlogHtml", () => {
  it("keeps allowed formatting tags", () => {
    const html = "<h2>Title</h2><p>Some <strong>bold</strong> and <em>italic</em> text.</p><ul><li>one</li></ul>";
    expect(sanitizeBlogHtml(html)).toBe(html);
  });

  it("strips <script> and its contents", () => {
    const out = sanitizeBlogHtml('<p>hi</p><script>alert(1)</script>');
    expect(out).toBe("<p>hi</p>");
    expect(out).not.toContain("script");
  });

  it("removes event-handler and style attributes", () => {
    const out = sanitizeBlogHtml('<p onclick="steal()" style="color:red">x</p>');
    expect(out).toBe("<p>x</p>");
  });

  it("drops javascript: links but keeps http/mailto links with safe rel/target", () => {
    expect(sanitizeBlogHtml('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:");
    const safe = sanitizeBlogHtml('<a href="https://example.com">x</a>');
    expect(safe).toContain('href="https://example.com"');
    expect(safe).toContain('rel="noopener noreferrer nofollow"');
    expect(safe).toContain('target="_blank"');
  });

  it("strips disallowed tags like iframe/img while keeping text", () => {
    expect(sanitizeBlogHtml('<iframe src="evil"></iframe><p>ok</p>')).toBe("<p>ok</p>");
    expect(sanitizeBlogHtml('<img src=x onerror=alert(1)><p>ok</p>')).toBe("<p>ok</p>");
  });
});
