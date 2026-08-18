import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The shell every listing card on the platform shares.
 *
 * Cars, parts, dealers, services, suppliers and import stock had each grown
 * their own copy of the same card, and the copies had drifted — three corner
 * radii, two body paddings, and on all of them a `hover:shadow-card` that the
 * theme defines as the resting shadow, so it never changed anything. Defining
 * it here means a grid of parts and a grid of cars feel like the same product.
 *
 * Two rules hold across every revision of the look.
 *
 * **Nothing is laid over the photograph.** `ListingCardMedia` takes no
 * children, so an overlay is not something a card can add without deliberately
 * changing this component's signature. The condition, the duty status and the
 * verification badge all sit under the picture, where text belongs — a car is
 * bought with the eyes first, and anything on top of the image competes with
 * the only thing on the card that actually sells it.
 *
 * **One movement, slowly.** The card rises and its shadow deepens; the
 * photograph drifts three per cent over most of a second. All of it behind
 * `motion-safe`, so anyone who has asked their system for reduced motion gets
 * the colour and the shadow and none of the travel.
 */
/**
 * The grid a page lays its cards out in.
 *
 * Six browse pages had each written out `grid gap-5 sm:grid-cols-2
 * lg:grid-cols-3` by hand, so the column count was six decisions rather than
 * one — and the two that had already gone to four across (a dealer's inventory,
 * the saved list) had drifted there alone.
 *
 * Four across from `xl`. Three cards on a wide screen leave a listing wider than
 * its own photograph is interesting, and the row you can take in at a glance is
 * the unit of browsing: four of them is one more comparison per glance without
 * the card losing anything, because nothing in it was sized to the column in the
 * first place — the title truncates, the specs are already a two-up grid, and
 * the price is a fixed size by design.
 *
 * The gap comes down with it, from twenty pixels to twelve. Twenty between three
 * cards reads as breathing room; between four it reads as a hole, because the
 * cards either side of it are narrower than the ones it was measured against.
 * Each card carries its own border and shadow, so the space between them is
 * doing less work than it would between borderless tiles.
 */
export function ListingGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {children}
    </div>
  );
}

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
        // The photograph runs to the card's own edge and the card clips it, so
        // the picture is the top of the card rather than a framed inset.
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-soft",
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
 * Deliberately accepts no children. Everything that used to be stamped on it —
 * "Ghana Used", "Duty Paid", "Verified" — is a tag below the image now.
 *
 * `muted` desaturates it, for stock with nothing left to reserve, so the
 * picture reads as unavailable without a word written across it.
 */
export function ListingCardMedia({
  src,
  alt,
  // Tracks `ListingGrid`'s columns. Not cosmetic: `sizes` is the only thing
  // telling the browser how big the file needs to be, so a card that says 33vw
  // in a four-column row downloads a third more picture than it can draw.
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw",
  aspect = "aspect-[16/11]",
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

/** The text half. */
export function ListingCardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-1 flex-col p-4", className)}>{children}</div>;
}

export type TagTone = "brand" | "success" | "muted";

const TAG_TONES: Record<TagTone, string> = {
  brand: "bg-brand-100 dark:bg-brand-900/40",
  success: "bg-success/[0.18]",
  muted: "bg-muted",
};

const TAG_ICON_TONES: Record<TagTone, string> = {
  brand: "text-brand-700 dark:text-brand-400",
  success: "text-success",
  muted: "text-muted-foreground",
};

export interface ListingTag {
  label: string;
  tone?: TagTone;
  /** A small glyph before the label — the shield on "Verified", typically. */
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * The pills, directly under the photograph.
 *
 * Each carries a tinted ground so it reads as its own chip, but the text is
 * plain foreground rather than the tint's own colour. Coloured text on a
 * coloured ground is two signals for one fact, and a grid of cards each showing
 * two of them is most of what made the badges shout — the tint alone separates
 * "Ghana Used" from "Duty Paid". Any glyph keeps the tone's colour, so the
 * shield still reads as a mark of trust rather than decoration.
 *
 * Small enough that two of them fit on one line in the narrowest column the
 * grid ever makes — a card beside the filter dock at 1280, about 196px. At the
 * old size "Refurbished" and "Reduced" wrapped to a second row there, and
 * because the row's other cards did not, that card's title, price and specs all
 * sat a line lower than its neighbours'. The grid stretches cards to equal
 * heights, so nothing looked broken; the row just stopped being readable across.
 */
export function ListingCardTags({ tags }: { tags: readonly ListingTag[] }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => {
        const tone = tag.tone ?? "muted";
        const Icon = tag.icon;
        return (
          <span
            key={tag.label}
            className={cn(
              "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5",
              "text-[11px] font-semibold text-foreground",
              TAG_TONES[tone],
            )}
          >
            {Icon && <Icon className={cn("h-3.5 w-3.5 shrink-0", TAG_ICON_TONES[tone])} />}
            {tag.label}
          </span>
        );
      })}
    </div>
  );
}

/**
 * The title, which is also the card's link, with room beside it for one action.
 *
 * `after:absolute after:inset-0` stretches the link's hit area over the whole
 * card, so the entire card is clickable without nesting anchors — and anything
 * genuinely interactive inside it (a save button, an add-to-cart) only has to
 * sit on `relative z-10` to stay above it.
 */
export function ListingCardTitle({
  href,
  children,
  action,
}: {
  href: string;
  children: React.ReactNode;
  /** Rendered to the right of the title — a save button, typically. */
  action?: React.ReactNode;
}) {
  return (
    <div className="mt-2.5 flex items-start justify-between gap-2">
      {/* Two lines, always — clamped so it can never run to three, and floored
          so it never collapses to one. On a four-across row a single truncated
          line cuts nearly every car mid-word ("2021 Toyota Ca…"), which is the
          trim level, the very thing that separates one listing from the next.
          Reserving the second line costs twenty pixels on the cards with short
          names and buys the thing that makes a row readable: the price and the
          specs sit on the same line across all four, so the eye compares them
          without reading them. */}
      <h3 className="min-h-[2.5rem] min-w-0 flex-1 font-semibold leading-tight">
        <Link
          href={href}
          className="line-clamp-2 transition-colors after:absolute after:inset-0 group-hover:text-brand-600"
        >
          {children}
        </Link>
      </h3>
      {action && <div className="relative z-10 -mr-1 -mt-1 shrink-0">{action}</div>}
    </div>
  );
}

/**
 * The price.
 *
 * Brand-coloured and kept small — on a card it is the figure the whole thing
 * exists to deliver, and colour rather than size is what gives it that without
 * making it the loudest thing on the screen. Tabular figures so prices align
 * digit for digit down a column, which is what lets the eye compare a row of
 * cards without reading them.
 */
export function ListingCardPrice({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-2 font-display text-base font-bold tabular-nums text-brand-700 dark:text-brand-400",
        className,
      )}
    >
      {children}
    </p>
  );
}

export interface ListingSpec {
  icon: React.ComponentType<{ className?: string }>;
  label: React.ReactNode;
}

/**
 * The facts, two to a row, each with its glyph.
 *
 * A two-column grid rather than a free wrap, so the second column lines up down
 * the card and a row of cards reads as a table you can scan across.
 */
export function ListingCardSpecs({ items }: { items: readonly ListingSpec[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-2 text-xs text-muted-foreground">
      {items.map(({ icon: Icon, label }, i) => (
        <span key={i} className="flex min-w-0 items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * Who is selling, and one fact about the thing — pinned to the bottom above a
 * hairline, so cards in a row end together however much sits above.
 */
export function ListingCardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs",
        className,
      )}
    >
      {children}
    </div>
  );
}
