import { notFound } from "next/navigation";
import Image from "next/image";
import { Calendar, Car, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { getDealerBySlug, getVehicles } from "@/lib/queries";
import { SITE } from "@/lib/constants";
import { whatsappUrl, safeJsonLd } from "@/lib/utils";
import { breadcrumbJsonLd } from "@/lib/seo";

export interface DealerDetailProps {
  slug: string;
  /** Rendered inside the authenticated shell — see VehicleDetail for why. */
  inShell?: boolean;
}

/** The dealer profile, shared by the public page and the in-shell one. */
export async function DealerDetail({ slug, inShell = false }: DealerDetailProps) {
  const dealer = await getDealerBySlug(slug);
  if (!dealer) notFound();

  const vehiclesBase = inShell ? "/app/marketplace/vehicles" : "/vehicles";

  const vehicles = (await getVehicles())
    .filter((v) => v.dealer.slug === dealer.slug)
    .slice(0, 8);

  const dealerLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: dealer.name,
    description: dealer.description,
    image: dealer.logo,
    url: `${SITE.url}/dealers/${dealer.slug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: dealer.city,
      addressRegion: dealer.region,
      addressCountry: "GH",
    },
    // Only advertise a rating when there are reviews — Google flags a rating
    // with a zero review count as invalid structured data.
    ...(dealer.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: dealer.rating,
            reviewCount: dealer.reviewCount,
          },
        }
      : {}),
  };

  return (
    <div>
      {!inShell && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: safeJsonLd(dealerLd) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: safeJsonLd(
                breadcrumbJsonLd([
                  { name: "Home", path: "/" },
                  { name: "Dealers", path: "/dealers" },
                  { name: dealer.name },
                ]),
              ),
            }}
          />
        </>
      )}
      {/* Cover */}
      <div className={`relative h-48 sm:h-60 ${inShell ? "overflow-hidden rounded-2xl" : ""}`}>
        <Image src={dealer.cover} alt={dealer.name} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
      </div>

      <div className={inShell ? "" : "container-page"}>
        <div className="-mt-16 flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-card sm:flex-row sm:items-end">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-background">
            <Image src={dealer.logo} alt={dealer.name} fill sizes="96px" className="object-cover" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold">{dealer.name}</h1>
              {dealer.verified && (
                <Badge variant="brand">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
                </Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {dealer.city}, {dealer.region}
              </span>
              <span className="flex items-center gap-1.5">
                <Car className="h-4 w-4" /> {dealer.vehicleCount} vehicles
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> {dealer.yearsInBusiness} yrs in business
              </span>
              <StarRating rating={dealer.rating} reviewCount={dealer.reviewCount} showValue />
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild className="bg-[#25D366] text-white hover:bg-[#20bd5a]">
              <a href={whatsappUrl(SITE.whatsapp, `Hi ${dealer.name}, I found you on CarVista.`)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>
                <Phone className="h-4 w-4" /> Call
              </a>
            </Button>
          </div>
        </div>

        <p className="mt-6 max-w-3xl text-muted-foreground">{dealer.description}</p>

        <section className="mt-10 pb-10">
          <h2 className="mb-6 text-xl font-bold">Available inventory</h2>
          {vehicles.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} basePath={vehiclesBase} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              This dealer has no active listings right now. Check back soon.
            </p>
          )}
        </section>

        <div className="pb-10">
          <ReviewsSection targetType="dealer" targetId={dealer.id} />
        </div>
      </div>
    </div>
  );
}
