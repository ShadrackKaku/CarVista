import { cn } from "@/lib/utils";

/**
 * A homepage section wrapper: a full-bleed background picture with a soft
 * overlay, and the section's content framed inside a large bordered card that
 * floats above it.
 */
export function SectionBackdrop({
  image,
  children,
  className,
  overlayClassName,
}: {
  image: string;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
}) {
  return (
    <section className={cn("relative isolate py-14 sm:py-16", className)}>
      {/* Background picture + overlay */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${image}')` }}
      >
        <div
          className={cn(
            "absolute inset-0 bg-background/45 dark:bg-background/65",
            overlayClassName,
          )}
        />
      </div>

      {/* Framed content */}
      <div className="container-page">
        <div className="rounded-[1.75rem] border-2 border-border/80 bg-card/90 p-6 shadow-card ring-1 ring-black/5 backdrop-blur-md sm:p-10 dark:ring-white/5">
          {children}
        </div>
      </div>
    </section>
  );
}
