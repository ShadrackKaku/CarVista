import Image from "next/image";
import { Car, MapPin, ShieldCheck, Star } from "lucide-react";
import {
  ListingCard,
  ListingCardAction,
  ListingCardBody,
  ListingCardFooter,
  ListingCardMedia,
  ListingCardSpecs,
  ListingCardTags,
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
          gradient whose only job was making a "Verified" pill legible; the pill
          has moved below, so the gradient had nothing left to do but dim the
          picture. */}
      <ListingCardMedia
        src={dealer.cover}
        alt={dealer.name}
        aspect="aspect-[16/9]"
        sizes="(max-width: 640px) 100vw, 25vw"
      />

      <ListingCardBody>
        <ListingCardTags
          tags={[
            { label: dealer.region, tone: "brand" },
            ...(dealer.verified ? [{ label: "Verified", tone: "success" as const }] : []),
          ]}
        />

        <ListingCardTitle href={href} reserveTwoLines={false}>
          <span className="inline-flex items-center gap-2">
            {/* The mark beside the name rather than straddling the edge of the
                photograph: a business is read by both together. */}
            <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md border bg-background">
              <Image src={dealer.logo} alt="" fill sizes="28px" className="object-cover" />
            </span>
            {dealer.name}
          </span>
        </ListingCardTitle>

        <ListingCardSpecs
          items={[
            { icon: MapPin, label: `${dealer.city}, ${dealer.region}` },
            { icon: Car, label: `${formatNumber(dealer.vehicleCount)} in stock` },
            { icon: Star, label: `${dealer.rating.toFixed(1)} (${dealer.reviewCount})` },
          ]}
        />

        <ListingCardFooter className="mt-5">
          <p className="inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-700 dark:text-brand-400">
            <ShieldCheck className="h-[18px] w-[18px] shrink-0" />
            {dealer.verified ? "Verified Dealer" : "Dealer"}
          </p>
          <ListingCardAction />
        </ListingCardFooter>
      </ListingCardBody>
    </ListingCard>
  );
}
