import { Gauge, MapPin, ShieldCheck, Ship } from "lucide-react";
import {
  ListingCard,
  ListingCardBody,
  ListingCardFooter,
  ListingCardMedia,
  ListingCardPrice,
  ListingCardSpecs,
  ListingCardTags,
  ListingCardTitle,
  type ListingSpec,
  type ListingTag,
} from "@/components/ui/listing-card";
import { formatSourceAmount, fobInGhs } from "@/lib/import-stock";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { ImportStockRow } from "@/lib/queries";

/**
 * One spec of foreign stock.
 *
 * The headline is the FOB, because that is the number the importer actually
 * commits to. The cedi figure beneath it is a conversion, not a landed cost —
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
  const soldOut = available === 0;

  const tags: ListingTag[] = [
    { label: listing.countryOfOrigin, tone: "brand" },
    ...(listing.auctionGrade
      ? [{ label: `Grade ${listing.auctionGrade}`, tone: "muted" as const }]
      : []),
  ];

  const specs: ListingSpec[] = [
    ...(listing.mileage != null
      ? [{ icon: Gauge, label: `${formatNumber(listing.mileage)} km` }]
      : []),
    ...(listing.portOfLoading ? [{ icon: MapPin, label: listing.portOfLoading }] : []),
  ];

  return (
    <ListingCard>
      {/* Stock with nothing left is desaturated rather than covered by a panel
          reading "All units reserved". The picture says it, and the words are
          in the footer where the rest of the availability lives. */}
      <ListingCardMedia
        src={listing.images[0]}
        alt={listing.title}
        muted={soldOut}
        fallback={<Ship className="h-8 w-8" />}
      />

      <ListingCardBody>
        <ListingCardTags tags={tags} />

        <ListingCardTitle href={`${basePath}/${listing.slug}`}>{listing.title}</ListingCardTitle>

        <ListingCardPrice className="flex items-baseline gap-1.5">
          {formatSourceAmount(listing.fobAmount, listing.fobCurrency)}
          <span className="text-xs font-semibold text-muted-foreground">FOB</span>
        </ListingCardPrice>

        {/* Say the cedi figure is missing rather than dropping the line. Three
            cards carrying one and a fourth carrying nothing reads as "cheaper",
            not as "we don't know". */}
        <p className="mt-1 text-xs text-muted-foreground">
          {fobGhs != null
            ? `≈ ${formatCurrency(fobGhs)} before shipping and duty`
            : "Cedi price on request"}
        </p>

        <ListingCardSpecs items={specs} />

        <ListingCardFooter>
          <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
            {listing.importer.verified && (
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />
            )}
            <span className="truncate">{listing.importer.name}</span>
          </span>
          <span
            className={
              soldOut ? "shrink-0 text-muted-foreground" : "shrink-0 font-medium text-foreground"
            }
          >
            {soldOut ? "Reserved" : `${available} of ${listing.quantity} free`}
          </span>
        </ListingCardFooter>
      </ListingCardBody>
    </ListingCard>
  );
}
