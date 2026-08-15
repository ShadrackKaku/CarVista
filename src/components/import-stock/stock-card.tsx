import { Check, Ship } from "lucide-react";
import {
  ListingCard,
  ListingCardBody,
  ListingCardEyebrow,
  ListingCardFooter,
  ListingCardMedia,
  ListingCardMeta,
  ListingCardPrice,
  ListingCardTitle,
} from "@/components/ui/listing-card";
import { formatSourceAmount, fobInGhs } from "@/lib/import-stock";
import { formatCurrency, formatNumber } from "@/lib/utils";
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
  const soldOut = available === 0;

  const specs = [
    listing.mileage != null ? `${formatNumber(listing.mileage)} km` : null,
    listing.portOfLoading,
  ].filter(Boolean);

  return (
    <ListingCard>
      {/* Stock with nothing left is desaturated rather than covered by a panel
          reading "All units reserved". The picture itself says it, and the
          words are in the eyebrow where the rest of the status lives. */}
      <ListingCardMedia
        src={listing.images[0]}
        alt={listing.title}
        aspect="aspect-[16/10]"
        muted={soldOut}
        fallback={<Ship className="h-8 w-8" />}
      />

      <ListingCardBody>
        {/* Origin, grade and availability — the three badges that used to sit
            on the photograph. */}
        <ListingCardEyebrow>
          {listing.countryOfOrigin}
          {listing.auctionGrade && (
            <span className="text-muted-foreground/60"> · Grade {listing.auctionGrade}</span>
          )}
          {soldOut && <span className="text-muted-foreground/60"> · All units reserved</span>}
        </ListingCardEyebrow>

        <ListingCardTitle href={`${basePath}/${listing.slug}`}>{listing.title}</ListingCardTitle>

        <ListingCardPrice className="flex items-baseline gap-1.5">
          {formatSourceAmount(listing.fobAmount, listing.fobCurrency)}
          <span className="text-[13px] font-medium text-muted-foreground">FOB</span>
        </ListingCardPrice>

        {/* Say the cedi figure is missing rather than dropping the line. Three
            cards carrying one and a fourth carrying nothing reads as "cheaper",
            not as "we don't know". */}
        <p className="mt-1 text-[13px] text-muted-foreground">
          {fobGhs != null
            ? `≈ ${formatCurrency(fobGhs)} before shipping and duty`
            : "Cedi price on request"}
        </p>

        {specs.length > 0 && <ListingCardMeta>{specs.join("  ·  ")}</ListingCardMeta>}

        <ListingCardFooter>
          <p className="flex min-w-0 items-center gap-1 truncate text-[13px] font-medium">
            <span className="truncate">{listing.importer.name}</span>
            {listing.importer.verified && (
              <Check className="h-3.5 w-3.5 shrink-0 text-success" aria-label="Verified importer" />
            )}
          </p>
          <span
            className={
              soldOut
                ? "shrink-0 text-[13px] text-muted-foreground"
                : "shrink-0 text-[13px] font-medium"
            }
          >
            {soldOut ? "Reserved" : `${available} of ${listing.quantity} free`}
          </span>
        </ListingCardFooter>
      </ListingCardBody>
    </ListingCard>
  );
}
