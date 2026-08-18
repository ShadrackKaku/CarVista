import { Clock, MapPin, Package, ShieldCheck, Star } from "lucide-react";
import {
  ListingCard,
  ListingCardAction,
  ListingCardBody,
  ListingCardFooter,
  ListingCardMedia,
  ListingCardSpecs,
  ListingCardTags,
  ListingCardTitle,
  type ListingSpec,
} from "@/components/ui/listing-card";
import { SUPPLIER_CATEGORY_LABELS } from "@/lib/suppliers";
import type { SupplierRow } from "@/lib/queries";

export interface SupplierCardProps {
  supplier: SupplierRow;
  /** Where the card links. The Marketplace module keeps clicks in the shell. */
  basePath?: string;
}

export function SupplierCard({ supplier, basePath = "/suppliers" }: SupplierCardProps) {
  const href = `${basePath}/${supplier.slug}`;

  // The terms a wholesale buyer is actually deciding on.
  const specs: ListingSpec[] = [
    ...(supplier.city
      ? [
          {
            icon: MapPin,
            label: `${supplier.city}${supplier.region ? `, ${supplier.region}` : ""}`,
          },
        ]
      : []),
    ...(supplier.minimumOrder
      ? [{ icon: Package, label: `Min. order ${supplier.minimumOrder}` }]
      : []),
    ...(supplier.leadTimeDays != null
      ? [{ icon: Clock, label: `${supplier.leadTimeDays}-day lead time` }]
      : []),
    ...(supplier.reviewCount > 0
      ? [{ icon: Star, label: `${supplier.rating.toFixed(1)} (${supplier.reviewCount})` }]
      : []),
  ];

  return (
    <ListingCard>
      <ListingCardMedia
        src={supplier.cover}
        alt=""
        aspect="aspect-[16/9]"
        sizes="(max-width: 640px) 100vw, 25vw"
      />

      <ListingCardBody>
        <ListingCardTags
          tags={[
            ...supplier.categories
              .slice(0, 2)
              .map((c) => ({ label: SUPPLIER_CATEGORY_LABELS[c] ?? c, tone: "brand" as const })),
            ...(supplier.verified ? [{ label: "Verified", tone: "success" as const }] : []),
          ]}
        />

        <ListingCardTitle href={href} reserveTwoLines={false}>
          {supplier.name}
        </ListingCardTitle>

        <ListingCardSpecs items={specs} />

        <ListingCardFooter className="mt-5">
          <p className="inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-700 dark:text-brand-400">
            <ShieldCheck className="h-[18px] w-[18px] shrink-0" />
            {supplier.verified ? "Verified Supplier" : "Wholesale supplier"}
          </p>
          <ListingCardAction>Get a quote</ListingCardAction>
        </ListingCardFooter>
      </ListingCardBody>
    </ListingCard>
  );
}
