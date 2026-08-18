import { MapPin, ShieldCheck, Star, Wrench } from "lucide-react";
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

  // One tag, so the row never wraps. Verification rides in the footer.
  const tags: ListingTag[] = [{ label: service.typeLabel, tone: "brand" }];

  return (
    <ListingCard>
      <ListingCardMedia src={service.image} alt={service.name} />

      <ListingCardBody>
        <ListingCardTags tags={tags} />

        <ListingCardTitle href={href}>{service.name}</ListingCardTitle>

        <ListingCardSpecs
          items={[
            { icon: MapPin, label: service.city },
            { icon: Star, label: `${service.rating.toFixed(1)} (${service.reviewCount})` },
            ...(service.services.length
              ? [{ icon: Wrench, label: service.services.slice(0, 2).join(", ") }]
              : []),
          ]}
        />

        <ListingCardFooter>
          <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
            {service.verified && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />}
            <span className="truncate">{service.region}</span>
          </span>
          <span className="shrink-0 font-medium text-foreground">{service.priceRange}</span>
        </ListingCardFooter>
      </ListingCardBody>
    </ListingCard>
  );
}
