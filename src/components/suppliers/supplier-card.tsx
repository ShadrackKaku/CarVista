import { Clock, MapPin, Package, ShieldCheck, Star } from "lucide-react";
import {
  ListingCard,
  ListingCardBody,
  ListingCardFooter,
  ListingCardMedia,
  ListingCardSpecs,
  ListingCardTags,
  ListingCardTitle,
  type ListingSpec,
  type ListingTag,
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

  // Two categories at most — a third wraps and leaves the grid ragged.
  // Verification rides in the footer.
  const tags: ListingTag[] = supplier.categories
    .slice(0, 2)
    .map((c) => ({ label: SUPPLIER_CATEGORY_LABELS[c] ?? c, tone: "brand" as const }));

  // The terms a wholesale buyer is actually deciding on.
  const specs: ListingSpec[] = [
    ...(supplier.city ? [{ icon: MapPin, label: supplier.city }] : []),
    ...(supplier.minimumOrder ? [{ icon: Package, label: `Min. ${supplier.minimumOrder}` }] : []),
    ...(supplier.leadTimeDays != null
      ? [{ icon: Clock, label: `${supplier.leadTimeDays}-day lead` }]
      : []),
    ...(supplier.reviewCount > 0
      ? [{ icon: Star, label: `${supplier.rating.toFixed(1)} (${supplier.reviewCount})` }]
      : []),
  ];

  return (
    <ListingCard>
      <ListingCardMedia src={supplier.cover} alt="" />

      <ListingCardBody>
        <ListingCardTags tags={tags} />

        <ListingCardTitle href={href}>{supplier.name}</ListingCardTitle>

        <ListingCardSpecs items={specs} />

        <ListingCardFooter>
          <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
            {supplier.verified && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />}
            <span className="truncate">{supplier.region ?? "Wholesale supplier"}</span>
          </span>
        </ListingCardFooter>
      </ListingCardBody>
    </ListingCard>
  );
}
