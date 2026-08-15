import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The shell every listing card on the platform shares.
 *
 * Cars, parts, dealers, services, suppliers and import stock had each grown
 * their own copy of the same six classes, and the copies had drifted: three
 * different corner radii, two body paddings, a half-pixel lift on some and a
 * full one on others, and — on all of them — `hover:shadow-card`, which the
 * theme defines as the same value as the resting `shadow-soft`, so the shadow
 * never actually changed. Defining it here means a grid of parts and a grid of
 * cars feel like the same product, and the next card type gets it for free.
 *
 * Three rules, and every detail follows from them.
 *
 * **Nothing is laid over the photograph.** `ListingCardMedia` takes no
 * children, so an overlay is not something a card can add without deleting that
 * decision on purpose. Anything a badge used to say belongs in the body, where
 * text belongs.
 *
 * **Colour means interaction, not emphasis.** Prices are plain; the brand
 * colour is kept for hover and focus, so when something turns blue it means you
 * can do something to it.
 *
 * **One movement, slowly.** The card rises and its shadow deepens; the
 * photograph drifts three per cent over most of a second. The 5%-in-500ms zoom
 * this replaces is a lurch, and a wall of them lurching in turn is visual
 * fatigue. All of it sits behind `motion-safe`.
 */
export function ListingCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft",
        "transition-[transform,box-shadow] duration-300 ease-out hover:shadow-lift",
        "motion-safe:hover:-translate-y-1",
        className,
      )}
    >
      {children}
    </article>
  );
}

/**
 * The photograph, alone.
 *
 * Deliberately accepts no children. A card is bought with the eyes first, and
 * anything on top of the image competes with the only thing on the card that
 * actually sells it.
 *
 * `muted` desaturates it — for stock with nothing left to reserve, where the
 * picture should read as unavailable without a word being written across it.
 */
export function ListingCardMedia({
  src,
  alt,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  aspect = "aspect-[4/3]",
  muted = false,
  fallback,
}: {
  src?: string | null;
  alt: string;
  sizes?: string;
  aspect?: string;
  muted?: boolean;
  /** Shown when there is no photograph at all. */
  fallback?: React.ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-muted", aspect)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={cn(
            "object-cover",
            "motion-safe:transition-transform motion-safe:duration-[900ms] motion-safe:ease-out",
            "motion-safe:group-hover:scale-[1.03]",
            muted && "opacity-60 saturate-50",
          )}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          {fallback}
        </div>
      )}
    </div>
  );
}

/** The text half. One padding, everywhere. */
export function ListingCardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-1 flex-col p-5", className)}>{children}</div>;
}

/**
 * The small line above the title.
 *
 * Where the badges went. Everything they said — the condition, the sale, the
 * source market, whether anything is left — reads here in one quiet line
 * instead of being stamped across the picture.
 */
export function ListingCardEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </p>
  );
}

/**
 * The title, which is also the card's link.
 *
 * `after:absolute after:inset-0` stretches its hit area over the whole card, so
 * the entire card is clickable without nesting anchors — and anything genuinely
 * interactive inside the card (a save button, an add-to-cart) only has to sit
 * on `relative z-10` to stay above it. Two lines are reserved from the
 * breakpoint where cards sit side by side, so the rows below them line up
 * across a grid; a ragged grid is its own kind of noise.
 */
export function ListingCardTitle({
  href,
  children,
  reserveTwoLines = true,
}: {
  href: string;
  children: React.ReactNode;
  reserveTwoLines?: boolean;
}) {
  return (
    <h3
      className={cn(
        "mt-1.5 text-[17px] font-semibold leading-[1.35] tracking-[-0.01em]",
        reserveTwoLines && "sm:min-h-[2.75rem]",
      )}
    >
      <Link
        href={href}
        className="line-clamp-2 transition-colors after:absolute after:inset-0 group-hover:text-brand-700 dark:group-hover:text-brand-400"
      >
        {children}
      </Link>
    </h3>
  );
}

/**
 * The price.
 *
 * Body face rather than the display one: `font-display` is Sora, drawn for page
 * headings, and at card size it stopped being the loudest thing on the card and
 * became the loudest thing on the screen. Tabular figures so prices align digit
 * for digit down a column, which is what lets the eye compare a row of cards
 * without reading them.
 */
export function ListingCardPrice({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("mt-3 text-xl font-semibold tracking-tight tabular-nums", className)}>
      {children}
    </p>
  );
}

/** The quiet sentence of facts under the price. */
export function ListingCardMeta({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-[13px] text-muted-foreground">{children}</p>;
}

/** Who is selling, pinned to the bottom so cards in a row end together. */
export function ListingCardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mt-auto flex items-end justify-between gap-3 pt-5", className)}>
      {children}
    </div>
  );
}
