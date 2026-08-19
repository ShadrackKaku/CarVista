import { Car, MapPin, ShieldCheck, Star } from "lucide-react";
import {
  ListingCard,
  ListingCardBody,
  ListingCardFooter,
  ListingCardMedia,
  ListingCardSpecs,
  ListingCardTags,
  ListingCardTitle,
  type ListingTag,
} from "@/components/ui/listing-card";
import { formatNumber } from "@/lib/utils";
import type { SampleDealer } from "@/lib/sample-data";

export interface DealerCardProps {
  dealer: SampleDealer;
  /**
   * Where the card links. Defaults to the public listing; the Marketplace
   * module passes its own path so a click stays inside the shell.
   */
  basePath?: string;
}

export function DealerCard({ dealer, basePath = "/dealers" }: DealerCardProps) {
  const href = `${basePath}/${dealer.slug}`;

  // One tag: a second wraps and leaves the grid ragged. Verification rides in
  // the footer beside the rating.
  const tags: ListingTag[] = [{ label: dealer.region, tone: "brand" }];

  return (
    <ListingCard>
      {/* The cover photograph, with nothing on it. It used to carry a dark
          gradient whose only job was making a "Verified" pill legible; the pill
          is a tag now, so the gradient had nothing left to do but dim the
          picture. */}
      <ListingCardMedia src={dealer.cover} alt={dealer.name} />

      <ListingCardBody>
        <ListingCardTags tags={tags} />

        <ListingCardTitle href={href}>{dealer.name}</ListingCardTitle>

        <ListingCardSpecs
          items={[
            { icon: MapPin, label: `${dealer.city}` },
            { icon: Car, label: `${formatNumber(dealer.vehicleCount)} in stock` },
          ]}
        />

        <ListingCardFooter>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Star className="h-3.5 w-3.5 shrink-0 text-warning" />
            {dealer.rating.toFixed(1)} ({dealer.reviewCount})
          </span>
          {dealer.verified && (
            <span className="flex shrink-0 items-center gap-1 font-medium text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" /> Verified
            </span>
          )}
        </ListingCardFooter>
      </ListingCardBody>
    </ListingCard>
  );
}
