import { ShieldCheck, Star, Tag } from "lucide-react";
import { AddToCartButton } from "@/components/parts/add-to-cart-button";
import {
  ListingCard,
  ListingCardBody,
  ListingCardFooter,
  ListingCardMedia,
  ListingCardPrice,
  ListingCardSpecs,
  ListingCardTags,
  ListingCardTitle,
  type ListingTag,
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

  const tags: ListingTag[] = [
    { label: CONDITION_LABELS[part.condition] ?? part.condition, tone: "brand" },
    ...(hasDiscount ? [{ label: "Reduced", tone: "success" as const }] : []),
  ];

  return (
    <ListingCard>
      {/* Square: a part is photographed on a white background and a landscape
          crop would cut it. */}
      <ListingCardMedia src={part.image} alt={part.name} aspect="aspect-square" />

      <ListingCardBody>
        <ListingCardTags tags={tags} />

        <ListingCardTitle href={href}>{part.name}</ListingCardTitle>

        <ListingCardPrice className="flex items-baseline gap-1.5">
          {formatCurrency(hasDiscount ? part.discountPrice! : part.price)}
          {hasDiscount && (
            <span className="text-xs font-medium text-muted-foreground line-through">
              {formatCurrency(part.price)}
            </span>
          )}
        </ListingCardPrice>

        <ListingCardSpecs
          items={[
            { icon: Tag, label: part.brand },
            { icon: Star, label: `${part.rating.toFixed(1)} (${part.reviewCount})` },
          ]}
        />

        <ListingCardFooter>
          <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
            {part.store.verified && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />}
            <span className="truncate">{part.store.name}</span>
          </span>
        </ListingCardFooter>

        {/* Above the card-wide link, so adding to the cart never navigates. */}
        <div className="relative z-10 mt-3">
          <AddToCartButton part={part} className="w-full" />
        </div>
      </ListingCardBody>
    </ListingCard>
  );
}
