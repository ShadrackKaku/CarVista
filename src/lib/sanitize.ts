import sanitizeHtml from "sanitize-html";

/**
 * Tags allowed in blog content — the output set produced by the TipTap editor
 * (StarterKit + Link). Everything else (script, style, iframe, event handlers,
 * inline styles…) is stripped, so stored/rendered HTML can't carry an XSS
 * payload even if it's POSTed directly to the API, bypassing the editor.
 */
const BLOG_ALLOWED_TAGS = [
  "p",
  "br",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "strong",
  "b",
  "em",
  "i",
  "s",
  "u",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "a",
];

/** Sanitize admin-authored blog HTML to a safe, known-good tag/attribute set. */
export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: BLOG_ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    // Force safe link attributes regardless of what was submitted.
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer nofollow",
        target: "_blank",
      }),
    },
  });
}

/** Plain text from an HTML string — for meta descriptions, OG tags and previews
 *  where markup would otherwise leak into the text. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
