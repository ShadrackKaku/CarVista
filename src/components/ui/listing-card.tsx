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
  sizes = "(max-width: 768px) 100vw, 33vw",
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
 */
export function ListingCardTags({ tags }: { tags: readonly ListingTag[] }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => {
        const tone = tag.tone ?? "muted";
        const Icon = tag.icon;
        return (
          <span
            key={tag.label}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-foreground",
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
      <h3 className="min-w-0 flex-1 font-semibold leading-tight">
        <Link
          href={href}
          className="block truncate transition-colors after:absolute after:inset-0 group-hover:text-brand-600"
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
    <div className="mt-3 grid grid-cols-2 gap-y-2 text-xs text-muted-foreground">
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
