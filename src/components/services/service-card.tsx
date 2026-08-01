import Link from "next/link";
import Image from "next/image";
import { MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";
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
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <Image
          src={service.image}
          alt={service.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Badge className="absolute left-3 top-3" variant="secondary">
          {service.typeLabel}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5">
          <h3 className="font-semibold transition-colors group-hover:text-brand-600">
            {service.name}
          </h3>
          {service.verified && <ShieldCheck className="h-4 w-4 text-success" />}
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {service.city}, {service.region}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {service.services.slice(0, 3).map((s) => (
            <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {s}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between border-t pt-3">
          <StarRating rating={service.rating} reviewCount={service.reviewCount} size={13} showValue />
          <span className="text-xs font-medium text-brand-600">{service.priceRange}</span>
        </div>
      </div>
    </Link>
  );
}
