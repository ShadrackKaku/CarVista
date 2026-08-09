import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, BadgeCheck, Ship } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReserveButton } from "@/components/import-stock/reserve-button";
import { BODY_TYPES, FUEL_TYPES, TRANSMISSIONS } from "@/lib/constants";
import { RESERVATION_FEE_GHS, RESERVATION_REFUND_RATE } from "@/lib/reservations";
import { RESERVATION_WORKING_DAYS } from "@/lib/ghana-calendar";
import { TIER_CONFIDENCE, stockPricing } from "@/lib/import-stock";
import { formatCurrency } from "@/lib/utils";
import type { DutyEstimate } from "@/lib/import-stock-server";
import type { ImportStockRow } from "@/lib/queries";

const CONFIDENCE_STYLE = {
  high: "bg-success/10 text-success",
  medium: "bg-brand-600/10 text-brand-700 dark:text-brand-200",
  low: "bg-muted text-muted-foreground",
} as const;

export function StockDetail({
  listing,
  duty,
}: {
  listing: ImportStockRow;
  duty: DutyEstimate | null;
}) {
  const available = Math.max(0, listing.quantity - listing.held);
  const pricing = stockPricing({
    fobAmount: listing.fobAmount,
    fobCurrency: listing.fobCurrency,
    fxRateToGhs: listing.fxRateToGhs,
    serviceFeeGhs: listing.serviceFeeGhs,
    freightGhs: listing.freightGhs,
    estimatedDutyGhs: duty?.ghs ?? null,
    dutyTier: duty?.tier ?? null,
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-6">
        <div className="relative h-72 overflow-hidden rounded-2xl border bg-muted sm:h-96">
          {listing.images[0] ? (
            <Image
              src={listing.images[0]}
              alt={listing.title}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Ship className="h-10 w-10" />
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="brand">{listing.countryOfOrigin}</Badge>
            {listing.auctionGrade && <Badge variant="secondary">Grade {listing.auctionGrade}</Badge>}
            {listing.portOfLoading && <Badge variant="outline">{listing.portOfLoading}</Badge>}
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">{listing.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Listed by{" "}
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              {listing.importer.name}
              {listing.importer.verified && <BadgeCheck className="h-4 w-4 text-brand-600" />}
            </span>
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-4 rounded-xl border bg-card p-5 text-sm sm:grid-cols-3">
          <Spec label="Year" value={String(listing.year)} />
          <Spec label="Mileage" value={listing.mileage != null ? `${listing.mileage.toLocaleString()} km` : null} />
          <Spec label="Fuel" value={enumLabel(FUEL_TYPES, listing.fuelType)} />
          <Spec label="Transmission" value={enumLabel(TRANSMISSIONS, listing.transmission)} />
          <Spec label="Body" value={enumLabel(BODY_TYPES, listing.bodyType)} />
          <Spec label="Colour" value={listing.color} />
          <Spec label="Trim" value={listing.trim} />
          <Spec label="Units available" value={`${available} of ${listing.quantity}`} />
          <Spec label="Typical ETA" value={listing.etaDays ? `${listing.etaDays} days` : null} />
        </dl>

        {duty && duty.receipts.length > 0 && (
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold">How we know</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Real ICUMS assessments for comparable cars, which is what the duty estimate is
              built from.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {duty.receipts.map((r, i) => (
                <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 border-t pt-2">
                  <span className="text-muted-foreground">
                    {r.label || "Comparable clearance"} · {r.port}
                    {r.assessedAt ? ` · ${r.assessedAt.slice(0, 10)}` : ""}
                  </span>
                  <span className="font-medium">{formatCurrency(r.totalTax)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Cost + reserve */}
      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <h2 className="font-semibold">Landed in Tema</h2>

          <ul className="mt-4 space-y-2.5 text-sm">
            {pricing.lines.map((line) => (
              <li key={line.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className={line.quoted ? "" : "text-muted-foreground"}>{line.label}</span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatCurrency(line.amountGhs)}
                  </span>
                </div>
                {line.note && <p className="text-xs text-muted-foreground">{line.note}</p>}
              </li>
            ))}
          </ul>

          {pricing.totalGhs != null ? (
            <div className="mt-4 flex items-baseline justify-between border-t pt-4">
              <span className="font-semibold">Estimated total</span>
              <span className="text-xl font-bold text-brand-600 tabular-nums">
                {formatCurrency(pricing.totalGhs)}
              </span>
            </div>
          ) : (
            <div className="mt-4 flex gap-2 border-t pt-4 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
              <span>
                We can&apos;t give a full landed cost yet — {pricing.missing.join(", ")} still
                missing.
                {pricing.committedGhs != null && (
                  <>
                    {" "}
                    The importer has quoted{" "}
                    <span className="font-medium text-foreground">
                      {formatCurrency(pricing.committedGhs)}
                    </span>{" "}
                    of it.
                  </>
                )}
              </span>
            </div>
          )}

          {duty && (
            <p
              className={`mt-3 rounded-lg px-3 py-2 text-xs ${CONFIDENCE_STYLE[TIER_CONFIDENCE[duty.tier]]}`}
            >
              Duty is an estimate until GRA assesses this chassis. It is not part of what the
              importer quotes.
            </p>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <ReserveButton
            listingId={listing.id}
            feeGhs={RESERVATION_FEE_GHS}
            refundRate={RESERVATION_REFUND_RATE}
            workingDays={RESERVATION_WORKING_DAYS}
            available={available}
          />
        </div>

        <p className="px-1 text-xs text-muted-foreground">
          Not the car you want?{" "}
          <Link href="/app/imports/new" className="font-medium text-brand-600 hover:underline">
            Tell us what to look for
          </Link>{" "}
          and importers will quote you.
        </p>
      </aside>
    </div>
  );
}

/**
 * Turn a stored enum into the label the pickers use.
 *
 * Values arrive as `SUV`, `PLUGIN_HYBRID`, `CVT`. Lowercasing and CSS
 * `capitalize` handles `PETROL` but wrecks the rest — `Suv`, `Plugin_hybrid`,
 * `Cvt` — so the shared label table is the source of truth, and anything not in
 * it (a free-text colour, a trim) is left exactly as the importer typed it.
 */
function enumLabel(
  table: ReadonlyArray<{ value: string; label: string }>,
  value: string | null,
): string | null {
  if (!value) return null;
  return table.find((o) => o.value === value)?.label ?? value;
}

function Spec({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}
