import { cn } from "@/lib/utils";

/**
 * A homepage section whose header sits on a full-width background picture
 * (with a scrim for legibility), and whose content sits below it on the normal
 * page background.
 */
export function SectionBackdrop({
  image,
  heading,
  children,
  className,
}: {
  image: string;
  heading: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("py-12 sm:py-16", className)}>
      <div className="container-page">
        {/* Header banner with background picture */}
        <div className="relative isolate overflow-hidden rounded-2xl border border-border/60">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-cover bg-center"
            style={{ backgroundImage: `url('${image}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/40" />
          </div>
          <div className="px-6 py-8 sm:px-9 sm:py-10">{heading}</div>
        </div>

        {/* Content (spacing comes from the grid's own top margin) */}
        {children}
      </div>
    </section>
  );
}
