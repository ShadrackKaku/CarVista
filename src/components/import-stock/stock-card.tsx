import { Gauge, MapPin, Ship, ShieldCheck } from "lucide-react";
import {
  ListingCard,
  ListingCardAction,
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
    {
      label: soldOut ? "All units reserved" : `${available} of ${listing.quantity} free`,
      tone: soldOut ? ("muted" as const) : ("success" as const),
    },
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
          in the tags where the rest of the status lives. */}
      <ListingCardMedia
        src={listing.images[0]}
        alt={listing.title}
        aspect="aspect-[16/10]"
        muted={soldOut}
        fallback={<Ship className="h-8 w-8" />}
      />

      <ListingCardBody>
        <ListingCardTags tags={tags} />

        <ListingCardTitle href={`${basePath}/${listing.slug}`}>{listing.title}</ListingCardTitle>

        <ListingCardPrice className="flex items-baseline gap-1.5">
          {formatSourceAmount(listing.fobAmount, listing.fobCurrency)}
          <span className="text-[14px] font-semibold text-muted-foreground">FOB</span>
        </ListingCardPrice>

        {/* Say the cedi figure is missing rather than dropping the line. Three
            cards carrying one and a fourth carrying nothing reads as "cheaper",
            not as "we don't know". */}
        <p className="mt-1 text-[13px] text-muted-foreground">
          {fobGhs != null
            ? `≈ ${formatCurrency(fobGhs)} before shipping and duty`
            : "Cedi price on request"}
        </p>

        <ListingCardSpecs items={specs} />

        <ListingCardFooter className="mt-5">
          <p className="inline-flex min-w-0 items-center gap-1.5 text-[14px] font-medium text-brand-700 dark:text-brand-400">
            {listing.importer.verified && <ShieldCheck className="h-[18px] w-[18px] shrink-0" />}
            <span className="truncate">{listing.importer.name}</span>
          </p>
          <ListingCardAction />
        </ListingCardFooter>
      </ListingCardBody>
    </ListingCard>
  );
}
