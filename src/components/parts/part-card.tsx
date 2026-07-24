import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";
import { AddToCartButton } from "@/components/parts/add-to-cart-button";
import { formatCurrency } from "@/lib/utils";
import type { SamplePart } from "@/lib/sample-data";

export function PartCard({ part }: { part: SamplePart }) {
  const hasDiscount = part.discountPrice && part.discountPrice < part.price;
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
      <Link href={`/parts/${part.slug}`} className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={part.image}
          alt={part.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {hasDiscount && (
          <Badge variant="destructive" className="absolute left-2.5 top-2.5">
            Sale
          </Badge>
        )}
        {part.condition !== "NEW" && (
          <Badge variant="muted" className="absolute right-2.5 top-2.5 capitalize">
            {part.condition.toLowerCase()}
          </Badge>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs font-medium text-brand-600">{part.brand}</span>
        <Link href={`/parts/${part.slug}`}>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-brand-600">
            {part.name}
          </h3>
        </Link>

        <div className="mt-2">
          <StarRating rating={part.rating} reviewCount={part.reviewCount} size={12} />
        </div>

        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-sm font-bold text-brand-700 transition-colors group-hover:text-foreground dark:text-brand-400 dark:group-hover:text-foreground">
              {formatCurrency(hasDiscount ? part.discountPrice! : part.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(part.price)}
              </span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            {part.store.verified && <ShieldCheck className="h-3 w-3 text-success" />}
            {part.store.name}
          </p>
          <AddToCartButton part={part} className="mt-3 w-full" />
        </div>
      </div>
    </div>
  );
}
