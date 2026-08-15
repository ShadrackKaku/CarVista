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
import { SUPPLIER_CATEGORY_LABELS } from "@/lib/suppliers";
import type { SupplierRow } from "@/lib/queries";

export interface SupplierCardProps {
  supplier: SupplierRow;
  /** Where the card links. The Marketplace module keeps clicks in the shell. */
  basePath?: string;
}

export function SupplierCard({ supplier, basePath = "/suppliers" }: SupplierCardProps) {
  const href = `${basePath}/${supplier.slug}`;

  // The terms a wholesale buyer is actually deciding on, as one line.
  const terms = [
    supplier.minimumOrder ? `Min. order ${supplier.minimumOrder}` : null,
    supplier.leadTimeDays != null ? `${supplier.leadTimeDays}-day lead time` : null,
  ].filter(Boolean);

  return (
    <ListingCard>
      <ListingCardMedia
        src={supplier.cover}
        alt=""
        aspect="aspect-[16/9]"
        sizes="(max-width: 640px) 100vw, 25vw"
      />

      <ListingCardBody>
        {/* What they stock — the chips, said as a line. */}
        {supplier.categories.length > 0 && (
          <ListingCardEyebrow>
            {supplier.categories
              .slice(0, 3)
              .map((c) => SUPPLIER_CATEGORY_LABELS[c] ?? c)
              .join(" · ")}
          </ListingCardEyebrow>
        )}

        <ListingCardTitle href={href} reserveTwoLines={false}>
          <span className="inline-flex items-center gap-1.5">
            {supplier.name}
            {supplier.verified && (
              <Check className="h-4 w-4 shrink-0 text-success" aria-label="Verified supplier" />
            )}
          </span>
        </ListingCardTitle>

        {supplier.city && (
          <ListingCardMeta>
            {supplier.city}
            {supplier.region ? `, ${supplier.region}` : ""}
          </ListingCardMeta>
        )}

        {terms.length > 0 && (
          <p className="mt-1 text-[13px] text-muted-foreground">{terms.join("  ·  ")}</p>
        )}

        {supplier.reviewCount > 0 && (
          <ListingCardFooter className="items-center">
            <StarRating rating={supplier.rating} reviewCount={supplier.reviewCount} showValue />
          </ListingCardFooter>
        )}
      </ListingCardBody>
    </ListingCard>
  );
}
