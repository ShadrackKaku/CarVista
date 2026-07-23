import { describe, it, expect } from "vitest";
import { estimateReadTime } from "./blog";
import { blogPostSchema } from "./validations";

describe("estimateReadTime", () => {
  it("returns at least 1 minute for short content", () => {
    expect(estimateReadTime("just a few words")).toBe(1);
    expect(estimateReadTime("")).toBe(1);
  });

  it("scales with word count (~200 wpm)", () => {
    const words = Array.from({ length: 600 }, () => "word").join(" ");
    expect(estimateReadTime(words)).toBe(3);
  });
});

describe("blogPostSchema", () => {
  const base = {
    title: "How to import a car into Ghana",
    content: "This is a sufficiently long piece of body content for the article.",
  };

  it("accepts a minimal valid post", () => {
    expect(blogPostSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a short title or short content", () => {
    expect(blogPostSchema.safeParse({ ...base, title: "Hi" }).success).toBe(false);
    expect(blogPostSchema.safeParse({ ...base, content: "too short" }).success).toBe(false);
  });

  it("accepts an empty cover image string but rejects a non-URL", () => {
    expect(blogPostSchema.safeParse({ ...base, coverImage: "" }).success).toBe(true);
    expect(blogPostSchema.safeParse({ ...base, coverImage: "not-a-url" }).success).toBe(false);
    expect(
      blogPostSchema.safeParse({ ...base, coverImage: "https://x.com/a.jpg" }).success,
    ).toBe(true);
  });

  it("coerces readTime and carries publish flags", () => {
    const parsed = blogPostSchema.safeParse({ ...base, readTime: "7", published: true, featured: true });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.readTime).toBe(7);
      expect(parsed.data.published).toBe(true);
      expect(parsed.data.featured).toBe(true);
    }
  });
});
