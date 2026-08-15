import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import { SaveVehicleButton } from "@/components/vehicles/save-vehicle-button";
import { enumLabel } from "@/lib/constants";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import type { SampleVehicle } from "@/lib/sample-data";

/**
 * A car in a grid.
 *
 * Three rules hold this together, and every detail below follows from them.
 *
 * **Nothing is laid over the photograph.** No badges, no gradient scrim, no
 * save button. A car is bought with the eyes first, and anything on top of the
 * image is competing with the only thing on the card that actually sells it.
 * Everything the badges used to say is said underneath, where text belongs.
 * The one thing that does touch it is motion, and only on the card you are
 * pointing at — see the hover notes below.
 *
 * **Colour means interaction, not emphasis.** The old card coloured the price
 * brand-blue, then put a brand badge, a green badge and a white badge on top of
 * the image — four things shouting at once, which is why a grid of them read as
 * noise. Emphasis here is size and weight; the brand colour is reserved for
 * hover and focus, so when something turns blue it means you can do something
 * to it.
 *
 * **One line, one job.** Specification is a single quiet sentence rather than a
 * two-by-two grid of icons — a gauge glyph beside "62,400 km" adds no
 * information and costs a fixation. The eye should fall down the card in four
 * stops: picture, name, price, details.
 */

const CONDITION_LABELS: Record<string, string> = {
  NEW: "Brand new",
  FOREIGN_USED: "Foreign used",
  GHANA_USED: "Ghana used",
  SALVAGE: "Salvage",
};

export interface VehicleCardProps {
  vehicle: SampleVehicle;
  /**
   * Where the card links. Defaults to the public listing; the Marketplace
   * module passes its own path so a click stays inside the shell instead of
   * dropping the user back onto the marketing site.
   */
  basePath?: string;
}

export function VehicleCard({ vehicle, basePath = "/vehicles" }: VehicleCardProps) {
  const href = `${basePath}/${vehicle.slug}`;

  // Read as one sentence, in the order someone asks: how far has it gone, how
  // does it drive, what does it drink.
  const specs = [
    `${formatNumber(vehicle.mileage)} km`,
    enumLabel(vehicle.transmission),
    enumLabel(vehicle.fuelType),
  ].filter(Boolean);

  const dutyPaid = vehicle.importStatus === "CLEARED";

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft",
        // One movement, slow enough to read as the card rising to meet you
        // rather than snapping. `shadow-lift` is the elevation's designed hover
        // partner — the card was reaching for `shadow-card`, which is the same
        // value as its resting state and so changed nothing.
        "transition-[transform,box-shadow] duration-300 ease-out hover:shadow-lift",
        "motion-safe:hover:-translate-y-1",
      )}
    >
      {/* The image, alone. */}
      <Link href={href} className="block" tabIndex={-1} aria-hidden>
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={vehicle.images[0]}
            alt={vehicle.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            // A drift, not a zoom. Three per cent over most of a second is felt
            // rather than seen; the 105-in-500ms this replaces was a lurch, and
            // a wall of them lurching in turn is the fatigue we set out to fix.
            // Suppressed entirely for anyone who asks for reduced motion.
            className="object-cover motion-safe:transition-transform motion-safe:duration-[900ms] motion-safe:ease-out motion-safe:group-hover:scale-[1.03]"
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        {/* What kind of car this is, said quietly before it is named. */}
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {CONDITION_LABELS[vehicle.condition] ?? vehicle.condition}
          {dutyPaid && <span className="text-muted-foreground/60"> · Duty paid</span>}
        </p>

        {/* Two lines are reserved from the breakpoint where cards sit beside
            each other, so prices line up across a row — a ragged grid is its
            own kind of noise. Below that they stack in one column, nothing
            needs aligning, and the reserved line would just be a gap. */}
        <h3 className="mt-1.5 text-[17px] font-semibold leading-[1.35] tracking-[-0.01em] sm:min-h-[2.75rem]">
          <Link
            href={href}
            className="line-clamp-2 transition-colors after:absolute after:inset-0 group-hover:text-brand-700 dark:group-hover:text-brand-400"
          >
            {vehicle.title}
          </Link>
        </h3>

        {/* The one element with real presence — and no more presence than that.
            It was set in the display face at 24px, which is Sora: wide,
            geometric, drawn to be a page heading. At that size it stopped being
            the loudest thing on the card and started being the loudest thing on
            the screen. The body face at 20px still leads the block without
            raising its voice, and blue stays reserved for things you can click.

            Tabular figures so prices align digit for digit down a column, which
            is what lets the eye compare a row of cards without reading them. */}
        <p className="mt-3 text-xl font-semibold tracking-tight tabular-nums">
          {formatCurrency(vehicle.price)}
        </p>

        <p className="mt-2 text-[13px] text-muted-foreground">{specs.join("  ·  ")}</p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate text-[13px] font-medium">
              {vehicle.dealer.name}
              {vehicle.dealer.verified && (
                <Check
                  className="h-3.5 w-3.5 shrink-0 text-success"
                  aria-label="Verified dealer"
                />
              )}
            </p>
            <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{vehicle.city}</p>
          </div>

          {/* Sits above the card-wide link, so saving never navigates. */}
          <div className="relative z-10 shrink-0">
            <SaveVehicleButton vehicleId={vehicle.id} />
          </div>
        </div>
      </div>
    </article>
  );
}
