import { Check } from "lucide-react";
import { StarRating } from "@/components/star-rating";
import {
  ListingCard,
  ListingCardBody,
  ListingCardEyebrow,
  ListingCardFooter,
  ListingCardMedia,
  ListingCardMeta,
  ListingCardTitle,
} from "@/components/ui/listing-card";
import type { SampleService } from "@/lib/sample-data";

export interface ServiceCardProps {
  service: SampleService;
  /**
   * Where the card links. Defaults to the public listing; the Marketplace
   * module passes its own path so a click stays inside the shell.
   */
  basePath?: string;
}

export function ServiceCard({ service, basePath = "/services" }: ServiceCardProps) {
  const href = `${basePath}/${service.slug}`;

  return (
    <ListingCard>
      <ListingCardMedia src={service.image} alt={service.name} aspect="aspect-[16/10]" />

      <ListingCardBody>
        {/* The type badge that used to sit on the photograph. */}
        <ListingCardEyebrow>{service.typeLabel}</ListingCardEyebrow>

        <ListingCardTitle href={href} reserveTwoLines={false}>
          <span className="inline-flex items-center gap-1.5">
            {service.name}
            {service.verified && (
              <Check className="h-4 w-4 shrink-0 text-success" aria-label="Verified provider" />
            )}
          </span>
        </ListingCardTitle>

        <ListingCardMeta>
          {service.city}, {service.region}
        </ListingCardMeta>

        {/* What they actually do, as one line rather than a row of chips. Three
            bordered pills for "Diagnostics", "Servicing", "Brakes" is three
            boxes to draw and read where a sentence does it in one. */}
        {service.services.length > 0 && (
          <p className="mt-2 line-clamp-1 text-[13px] text-muted-foreground">
            {service.services.slice(0, 3).join("  ·  ")}
          </p>
        )}

        <ListingCardFooter className="items-center">
          <StarRating
            rating={service.rating}
            reviewCount={service.reviewCount}
            size={13}
            showValue
          />
          <span className="shrink-0 text-[13px] text-muted-foreground">{service.priceRange}</span>
        </ListingCardFooter>
      </ListingCardBody>
    </ListingCard>
  );
}
