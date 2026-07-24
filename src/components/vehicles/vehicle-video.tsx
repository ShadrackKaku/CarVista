import { getVideoEmbed } from "@/lib/video";

/** Renders a listing's walk-around video: an embedded YouTube/Vimeo player, or
 *  a native <video> element for a directly-hosted file. */
export function VehicleVideo({ url, title }: { url: string; title: string }) {
  const { type, src } = getVideoEmbed(url);

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border bg-muted">
      {type === "file" ? (
        <video src={src} controls preload="metadata" className="h-full w-full">
          {/* Uploaded walk-arounds have no caption file; present for a11y. */}
          <track kind="captions" />
        </video>
      ) : (
        <iframe
          src={src}
          title={`${title} — video`}
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      )}
    </div>
  );
}
