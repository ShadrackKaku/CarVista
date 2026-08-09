import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Gauge, MapPin, Ship } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatSourceAmount, fobInGhs } from "@/lib/import-stock";
import { formatCurrency } from "@/lib/utils";
import type { ImportStockRow } from "@/lib/queries";

/**
 * One spec of foreign stock.
 *
 * The headline is the FOB, because that is the number the importer actually
 * commits to. The cedi figure beside it is a conversion, not a landed cost —
 * putting a landed total on a card would present a duty estimate with more
 * confidence than it has, and the detail page is where the breakdown belongs.
 */
export function StockCard({
  listing,
  basePath = "/imports/stock",
}: {
  listing: ImportStockRow;
  basePath?: string;
}) {
  const available = Math.max(0, listing.quantity - listing.held);
  const fobGhs = fobInGhs(listing);

  return (
    <Link
      href={`${basePath}/${listing.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="relative h-44 overflow-hidden bg-muted">
        {listing.images[0] ? (
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Ship className="h-8 w-8" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge variant="brand">{listing.countryOfOrigin}</Badge>
          {listing.auctionGrade && <Badge variant="secondary">Grade {listing.auctionGrade}</Badge>}
        </div>
        {available === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/75">
            <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
              All units reserved
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate font-semibold">{listing.title}</h3>

        <p className="mt-1 text-lg font-bold text-brand-600">
          {formatSourceAmount(listing.fobAmount, listing.fobCurrency)}
          <span className="ml-1 text-xs font-medium text-muted-foreground">FOB</span>
        </p>
        {/* Say the cedi figure is missing rather than dropping the line. Three
            cards carrying one and a fourth carrying nothing reads as "cheaper",
            not as "we don't know". */}
        {fobGhs != null ? (
          <p className="text-xs text-muted-foreground">
            ≈ {formatCurrency(fobGhs)} before shipping and duty
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Cedi price on request</p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs text-muted-foreground">
          {listing.mileage != null && (
            <span className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5" />
              {listing.mileage.toLocaleString()} km
            </span>
          )}
          {listing.portOfLoading && (
            <span className="flex min-w-0 items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{listing.portOfLoading}</span>
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs">
          <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
            {listing.importer.verified && (
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-brand-600" />
            )}
            <span className="truncate">{listing.importer.name}</span>
          </span>
          <span className={available > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}>
            {available > 0 ? `${available} of ${listing.quantity} free` : "Reserved"}
          </span>
        </div>
      </div>
    </Link>
  );
}
