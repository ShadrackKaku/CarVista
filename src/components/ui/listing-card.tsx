import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The shell every listing card on the platform shares.
 *
 * Cars, parts, dealers, services, suppliers and import stock had each grown
 * their own copy of the same card, and the copies had drifted. Defining it here
 * means a grid of parts and a grid of cars feel like the same product, and the
 * next card type gets it for free.
 *
 * Two rules survive every revision of the look.
 *
 * **Nothing is laid over the photograph.** `ListingCardMedia` takes no
 * children, so an overlay is not something a card can add without deleting that
 * decision on purpose. Tags sit under the picture, where text belongs.
 *
 * **One movement, slowly.** The card rises and its shadow deepens; the
 * photograph drifts three per cent over most of a second. All of it behind
 * `motion-safe`, so anyone who has asked their system for reduced motion gets
 * the colour and the shadow and none of the travel.
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
        // The padding is the point: the photograph is inset rather than
        // bleeding to the border, so the card reads as a mount around a picture
        // instead of a picture with a caption stuck underneath.
        "group relative flex flex-col rounded-2xl border bg-card p-3 shadow-soft",
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
 * The photograph, alone, with its own corners inside the card's.
 *
 * Deliberately accepts no children. A car is bought with the eyes first, and
 * anything on top of the image competes with the only thing on the card that
 * actually sells it.
 *
 * `muted` desaturates it — for stock with nothing left to reserve, where the
 * picture should read as unavailable without a word written across it.
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
    <div className={cn("relative overflow-hidden rounded-xl bg-muted", aspect)}>
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
  return <div className={cn("flex flex-1 flex-col px-2 pb-1 pt-4", className)}>{children}</div>;
}

export type TagTone = "brand" | "success" | "muted";

const TAG_TONES: Record<TagTone, string> = {
  brand: "bg-brand-100 dark:bg-brand-900/40",
  success: "bg-success/[0.18]",
  muted: "bg-muted",
};

export interface ListingTag {
  label: string;
  tone?: TagTone;
}

/**
 * The pills under the photograph.
 *
 * They carry a tinted background so each reads as its own chip, but the text is
 * plain foreground rather than the tint's own colour. Coloured text on a
 * coloured ground is two signals for one fact, and a grid of cards each showing
 * two of them was most of what made the old design shout — the tint alone is
 * enough to separate "Ghana used" from "Duty paid".
 */
export function ListingCardTags({ tags }: { tags: readonly ListingTag[] }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag.label}
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-[13px] font-semibold text-foreground",
            TAG_TONES[tag.tone ?? "muted"],
          )}
        >
          {tag.label}
        </span>
      ))}
    </div>
  );
}

/**
 * The title, which is also the card's link, with room beside it for one action.
 *
 * `after:absolute after:inset-0` stretches the link's hit area over the whole
 * card, so the entire card is clickable without nesting anchors — and anything
 * genuinely interactive inside it (a save button, an add-to-cart) only has to
 * sit on `relative z-10` to stay above.
 */
export function ListingCardTitle({
  href,
  children,
  action,
  reserveTwoLines = true,
}: {
  href: string;
  children: React.ReactNode;
  /** Rendered to the right of the title — a save button, typically. */
  action?: React.ReactNode;
  reserveTwoLines?: boolean;
}) {
  return (
    <div className="mt-3 flex items-start justify-between gap-3">
      <h3
        className={cn(
          "min-w-0 flex-1 text-[19px] font-bold leading-[1.3] tracking-[-0.015em]",
          reserveTwoLines && "sm:min-h-[3rem]",
        )}
      >
        <Link
          href={href}
          className="line-clamp-2 transition-colors after:absolute after:inset-0 group-hover:text-brand-700 dark:group-hover:text-brand-400"
        >
          {children}
        </Link>
      </h3>
      {action && <div className="relative z-10 shrink-0">{action}</div>}
    </div>
  );
}

/**
 * The price.
 *
 * Brand-coloured, because on a marketplace card it is the one figure the whole
 * card exists to deliver. Body face rather than the display one — `font-display`
 * is Sora, drawn for page headings, and at card size it stopped being the
 * loudest thing on the card and became the loudest thing on the screen.
 * Tabular figures so prices align digit for digit down a column, which is what
 * lets the eye compare a row of cards without reading them.
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
        "mt-1 text-xl font-bold tracking-tight tabular-nums text-brand-700 dark:text-brand-400",
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
 * The facts, each with its glyph.
 *
 * A flex wrap rather than a fixed grid, so a card with two facts does not leave
 * a hole where the third would be and a long place name drops to its own line
 * instead of squeezing its neighbours.
 */
export function ListingCardSpecs({ items }: { items: readonly ListingSpec[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2.5 text-[14px] text-muted-foreground">
      {items.map(({ icon: Icon, label }, i) => (
        <span key={i} className="inline-flex min-w-0 items-center gap-2">
          <Icon className="h-[18px] w-[18px] shrink-0" />
          <span className="truncate">{label}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * Who is selling, and the way in.
 *
 * Pinned to the bottom so cards in a row end together, above a hairline that
 * separates what the thing is from who is offering it.
 */
export function ListingCardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mt-auto flex items-center justify-between gap-3 border-t pt-4", className)}>
      {children}
    </div>
  );
}

/**
 * The "View details" affordance.
 *
 * The whole card is already a link, so this navigates nothing on its own — it
 * is a signpost, telling a first-time visitor that the card is a door. Its
 * arrow leans in on hover, which is the only place on the card besides the
 * photograph where anything moves.
 */
export function ListingCardAction({ children = "View details" }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 text-[14px] font-semibold text-brand-700 dark:text-brand-400">
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out motion-safe:group-hover:translate-x-1" />
    </span>
  );
}

/** The seller line: name, then their standing beneath it. */
export function ListingCardSeller({
  name,
  verified,
  verifiedLabel = "Verified Dealer",
  icon: Icon,
}: {
  name: string;
  verified?: boolean;
  verifiedLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[15px] font-bold">{name}</p>
      {verified && (
        <p className="mt-0.5 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-700 dark:text-brand-400">
          {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
          {verifiedLabel}
        </p>
      )}
    </div>
  );
}
