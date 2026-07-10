import Link from "next/link";
import Image from "next/image";
import { Car, MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";
import type { SampleDealer } from "@/lib/sample-data";

export function DealerCard({ dealer }: { dealer: SampleDealer }) {
  return (
    <Link
      href={`/dealers/${dealer.slug}`}
      className="group overflow-hidden rounded-xl border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="relative h-28 overflow-hidden bg-muted">
        <Image
          src={dealer.cover}
          alt={dealer.name}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
      <div className="px-4 pb-4">
        <div className="-mt-8 flex items-end justify-between">
          <div className="relative h-16 w-16 overflow-hidden rounded-xl border-4 border-card bg-background">
            <Image src={dealer.logo} alt={dealer.name} fill className="object-cover" />
          </div>
          {dealer.verified && (
            <Badge variant="brand" className="mb-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified
            </Badge>
          )}
        </div>
        <h3 className="mt-3 font-semibold transition-colors group-hover:text-brand-600">
          {dealer.name}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {dealer.city}, {dealer.region}
        </p>
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <StarRating rating={dealer.rating} reviewCount={dealer.reviewCount} size={13} showValue />
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Car className="h-3.5 w-3.5" /> {dealer.vehicleCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
