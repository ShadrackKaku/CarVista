import Image from "next/image";
import { Check } from "lucide-react";
import { StarRating } from "@/components/star-rating";
import {
  ListingCard,
  ListingCardBody,
  ListingCardFooter,
  ListingCardMedia,
  ListingCardMeta,
  ListingCardTitle,
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

  return (
    <ListingCard>
      {/* The cover photograph, with nothing on it. It used to carry a dark
          gradient whose only job was making a "Verified" badge legible — the
          badge has moved into the text, so the gradient had nothing left to do
          but dim the picture. */}
      <ListingCardMedia
        src={dealer.cover}
        alt={dealer.name}
        aspect="aspect-[16/9]"
        sizes="(max-width: 640px) 100vw, 25vw"
      />

      <ListingCardBody>
        <div className="flex items-center gap-3">
          {/* The logo sits beside the name rather than straddling the edge of
              the photograph: a business is identified by its mark and its name
              together, and reading them on one line is quicker than reading a
              badge that overlaps a picture. */}
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border bg-background">
            <Image src={dealer.logo} alt="" fill sizes="36px" className="object-cover" />
          </span>
          <div className="min-w-0 flex-1">
            <ListingCardTitle href={href} reserveTwoLines={false}>
              <span className="inline-flex items-center gap-1.5">
                {dealer.name}
                {dealer.verified && (
                  <Check
                    className="h-4 w-4 shrink-0 text-success"
                    aria-label="Verified dealer"
                  />
                )}
              </span>
            </ListingCardTitle>
          </div>
        </div>

        <ListingCardMeta>
          {dealer.city}, {dealer.region}
        </ListingCardMeta>

        <ListingCardFooter className="items-center">
          <StarRating rating={dealer.rating} reviewCount={dealer.reviewCount} size={13} showValue />
          <span className="shrink-0 text-[13px] text-muted-foreground">
            {formatNumber(dealer.vehicleCount)} in stock
          </span>
        </ListingCardFooter>
      </ListingCardBody>
    </ListingCard>
  );
}
