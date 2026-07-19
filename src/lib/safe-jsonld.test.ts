import { describe, it, expect } from "vitest";
import { safeJsonLd } from "@/lib/utils";

describe("safeJsonLd", () => {
  it("escapes characters that could break out of a <script> block", () => {
    const out = safeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<script>");
    expect(out).toContain("\\u003c"); // <
    expect(out).toContain("\\u003e"); // >
  });

  it("escapes ampersands and the JS line separators U+2028/U+2029", () => {
    const seps = String.fromCharCode(0x2028) + String.fromCharCode(0x2029);
    const out = safeJsonLd({ a: "Tom & Jerry", b: seps });
    expect(out).toContain("\\u0026");
    expect(out).toContain("\\u2028");
    expect(out).toContain("\\u2029");
  });

  it("stays valid JSON that round-trips to the original value", () => {
    const value = { name: "Toyota <Camry> & Co", n: 42, nested: { x: "</a>" } };
    const parsed = JSON.parse(safeJsonLd(value));
    expect(parsed).toEqual(value);
  });

  it("leaves safe content untouched", () => {
    expect(safeJsonLd({ ok: "Honda Civic 2020" })).toBe('{"ok":"Honda Civic 2020"}');
  });
});
