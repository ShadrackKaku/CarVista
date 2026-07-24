import { describe, it, expect } from "vitest";
import { getVideoEmbed } from "./video";

describe("getVideoEmbed", () => {
  it("resolves YouTube watch / short / youtu.be URLs to the embed URL", () => {
    const expected = "https://www.youtube.com/embed/dQw4w9WgXcQ";
    expect(getVideoEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      type: "youtube",
      src: expected,
    });
    expect(getVideoEmbed("https://youtu.be/dQw4w9WgXcQ").src).toBe(expected);
    expect(getVideoEmbed("https://youtube.com/shorts/dQw4w9WgXcQ").src).toBe(expected);
    expect(getVideoEmbed("https://www.youtube.com/watch?list=x&v=dQw4w9WgXcQ&t=5").src).toBe(
      expected,
    );
  });

  it("resolves Vimeo URLs to the player URL", () => {
    expect(getVideoEmbed("https://vimeo.com/123456789")).toEqual({
      type: "vimeo",
      src: "https://player.vimeo.com/video/123456789",
    });
  });

  it("treats other URLs as a direct video file", () => {
    const url = "https://res.cloudinary.com/demo/video/upload/sample.mp4";
    expect(getVideoEmbed(url)).toEqual({ type: "file", src: url });
  });
});
