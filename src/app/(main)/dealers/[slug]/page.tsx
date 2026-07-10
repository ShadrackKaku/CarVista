import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Calendar, Car, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { SAMPLE_DEALERS, getExpandedVehicles } from "@/lib/sample-data";
import { SITE } from "@/lib/constants";
import { whatsappUrl } from "@/lib/utils";

export function generateStaticParams() {
  return SAMPLE_DEALERS.map((d) => ({ slug: d.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const dealer = SAMPLE_DEALERS.find((d) => d.slug === params.slug);
  if (!dealer) return { title: "Dealer not found" };
  return {
    title: `${dealer.name} — Car Dealer in ${dealer.city}`,
    description: dealer.description,
    alternates: { canonical: `/dealers/${dealer.slug}` },
  };
}

export default function DealerDetailPage({ params }: { params: { slug: string } }) {
  const dealer = SAMPLE_DEALERS.find((d) => d.slug === params.slug);
  if (!dealer) notFound();

  const vehicles = getExpandedVehicles()
    .filter((v) => v.dealer.slug === dealer.slug)
    .slice(0, 8);

  return (
    <div>
      {/* Cover */}
      <div className="relative h-48 sm:h-60">
        <Image src={dealer.cover} alt={dealer.name} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
      </div>

      <div className="container-page">
        <div className="-mt-16 flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-card sm:flex-row sm:items-end">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-background">
            <Image src={dealer.logo} alt={dealer.name} fill className="object-cover" />
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

        <section className="mt-10 pb-16">
          <h2 className="mb-6 text-xl font-bold">Available inventory</h2>
          {vehicles.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              This dealer has no active listings right now. Check back soon.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
