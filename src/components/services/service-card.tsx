import { MapPin, ShieldCheck, Star, Wrench } from "lucide-react";
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
        <ListingCardTags
          tags={[
            { label: service.typeLabel, tone: "brand" },
            ...(service.verified ? [{ label: "Verified", tone: "success" as const }] : []),
          ]}
        />

        <ListingCardTitle href={href} reserveTwoLines={false}>
          {service.name}
        </ListingCardTitle>

        <ListingCardSpecs
          items={[
            { icon: MapPin, label: `${service.city}, ${service.region}` },
            { icon: Star, label: `${service.rating.toFixed(1)} (${service.reviewCount})` },
            ...(service.services.length
              ? [{ icon: Wrench, label: service.services.slice(0, 2).join(", ") }]
              : []),
          ]}
        />

        <ListingCardFooter className="mt-5">
          <p className="inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-700 dark:text-brand-400">
            <ShieldCheck className="h-[18px] w-[18px] shrink-0" />
            {service.priceRange}
          </p>
          <ListingCardAction />
        </ListingCardFooter>
      </ListingCardBody>
    </ListingCard>
  );
}
