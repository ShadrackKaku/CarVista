import { Check } from "lucide-react";
import { StarRating } from "@/components/star-rating";
import { AddToCartButton } from "@/components/parts/add-to-cart-button";
import {
  ListingCard,
  ListingCardBody,
  ListingCardEyebrow,
  ListingCardMedia,
  ListingCardPrice,
  ListingCardTitle,
} from "@/components/ui/listing-card";
import { formatCurrency } from "@/lib/utils";
import type { SamplePart } from "@/lib/sample-data";

const CONDITION_LABELS: Record<string, string> = {
  NEW: "New",
  USED: "Used",
  REFURBISHED: "Refurbished",
};

export interface PartCardProps {
  part: SamplePart;
  /**
   * Where the card links. Defaults to the public listing; the Marketplace
   * module passes its own path so a click stays inside the shell.
   */
  basePath?: string;
}

export function PartCard({ part, basePath = "/parts" }: PartCardProps) {
  const href = `${basePath}/${part.slug}`;
  const hasDiscount = Boolean(part.discountPrice && part.discountPrice < part.price);

  return (
    <ListingCard>
      {/* Square, because a part is photographed on a white background and a
          landscape crop would cut it. */}
      <ListingCardMedia
        src={part.image}
        alt={part.name}
        aspect="aspect-square"
        sizes="(max-width: 640px) 50vw, 25vw"
      />

      <ListingCardBody>
        {/* Brand, condition and the fact of a discount — everything the two
            badges on the photograph used to say, said here instead. */}
        <ListingCardEyebrow>
          {part.brand}
          {part.condition !== "NEW" && (
            <span className="text-muted-foreground/60">
              {" · "}
              {CONDITION_LABELS[part.condition] ?? part.condition}
            </span>
          )}
          {hasDiscount && <span className="text-muted-foreground/60"> · Reduced</span>}
        </ListingCardEyebrow>

        <ListingCardTitle href={href}>{part.name}</ListingCardTitle>

        <ListingCardPrice className="flex items-baseline gap-2">
          {formatCurrency(hasDiscount ? part.discountPrice! : part.price)}
          {hasDiscount && (
            <span className="text-[13px] font-normal text-muted-foreground line-through">
              {formatCurrency(part.price)}
            </span>
          )}
        </ListingCardPrice>

        <div className="mt-2">
          <StarRating rating={part.rating} reviewCount={part.reviewCount} size={12} />
        </div>

        <div className="mt-auto pt-5">
          <p className="flex items-center gap-1 truncate text-[13px] font-medium">
            {part.store.name}
            {part.store.verified && (
              <Check className="h-3.5 w-3.5 shrink-0 text-success" aria-label="Verified store" />
            )}
          </p>
          {/* Above the card-wide link, so adding to the cart never navigates. */}
          <div className="relative z-10">
            <AddToCartButton part={part} className="mt-3 w-full" />
          </div>
        </div>
      </ListingCardBody>
    </ListingCard>
  );
}
