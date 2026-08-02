import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin, Package, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";
import { SUPPLIER_CATEGORY_LABELS } from "@/lib/suppliers";
import type { SupplierRow } from "@/lib/queries";

export interface SupplierCardProps {
  supplier: SupplierRow;
  /** Where the card links. The Marketplace module keeps clicks in the shell. */
  basePath?: string;
}

export function SupplierCard({ supplier, basePath = "/suppliers" }: SupplierCardProps) {
  const href = `${basePath}/${supplier.slug}`;
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="relative h-28 overflow-hidden bg-muted">
        <Image
          src={supplier.cover}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold leading-tight transition-colors group-hover:text-brand-600">
            {supplier.name}
          </h3>
          {supplier.verified && (
            <Badge variant="success" className="shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified
            </Badge>
          )}
        </div>

        {supplier.categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {supplier.categories.slice(0, 3).map((c) => (
              <span
                key={c}
                className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {SUPPLIER_CATEGORY_LABELS[c] ?? c}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex-1 space-y-1.5 text-xs text-muted-foreground">
          {supplier.city && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" /> {supplier.city}
              {supplier.region ? `, ${supplier.region}` : ""}
            </span>
          )}
          {supplier.minimumOrder && (
            <span className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 shrink-0" /> Minimum order {supplier.minimumOrder}
            </span>
          )}
          {supplier.leadTimeDays != null && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" /> {supplier.leadTimeDays}-day lead time
            </span>
          )}
        </div>

        {supplier.reviewCount > 0 && (
          <div className="mt-3 border-t pt-3">
            <StarRating rating={supplier.rating} reviewCount={supplier.reviewCount} showValue />
          </div>
        )}
      </div>
    </Link>
  );
}
