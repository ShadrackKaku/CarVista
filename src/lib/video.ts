export type VideoEmbedType = "youtube" | "vimeo" | "file";

export interface VideoEmbed {
  type: VideoEmbedType;
  /** The URL to use for the iframe (youtube/vimeo) or <video> element (file). */
  src: string;
}

/**
 * Resolve a user-submitted video URL to something embeddable:
 *  - YouTube (watch / youtu.be / shorts / embed) → the /embed/ID iframe URL
 *  - Vimeo → the player.vimeo.com iframe URL
 *  - anything else → treated as a direct video file for a <video> element
 */
export function getVideoEmbed(url: string): VideoEmbed {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (yt) return { type: "youtube", src: `https://www.youtube.com/embed/${yt[1]}` };

  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { type: "vimeo", src: `https://player.vimeo.com/video/${vm[1]}` };

  return { type: "file", src: url };
}
