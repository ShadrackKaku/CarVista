import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { getServiceBySlug } from "@/lib/queries";
import { SITE } from "@/lib/constants";
import { whatsappUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const service = await getServiceBySlug(params.slug);
  if (!service) return { title: "Service not found" };
  return {
    title: `${service.name} — ${service.typeLabel} in ${service.city}`,
    description: `${service.name} offers ${service.services.join(", ")} in ${service.city}, Ghana.`,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default async function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = await getServiceBySlug(params.slug);
  if (!service) notFound();

  return (
    <div className="container-page py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border bg-muted">
            <Image src={service.image} alt={service.name} fill priority className="object-cover" />
          </div>
          <div className="mt-6 flex items-center gap-2">
            <Badge variant="secondary">{service.typeLabel}</Badge>
            {service.verified && (
              <Badge variant="brand">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </Badge>
            )}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">{service.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {service.city}, {service.region}
            </span>
            <StarRating rating={service.rating} reviewCount={service.reviewCount} showValue />
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-bold">Services offered</h2>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {service.services.map((s) => (
                <div key={s} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  {s}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-xl border bg-card p-5">
            <h2 className="font-semibold">About</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {service.name} is a {service.verified ? "CarVista-verified" : "listed"} {service.typeLabel.toLowerCase()} based in {service.city}. With a {service.rating.toFixed(1)}-star rating across {service.reviewCount} reviews, they are trusted by drivers across the {service.region} region.
            </p>
          </section>
        </div>

        <aside className="space-y-5">
          <div className="sticky top-24 rounded-2xl border bg-card p-6 shadow-soft">
            <p className="text-sm text-muted-foreground">Typical price range</p>
            <p className="font-display text-2xl font-bold text-brand-700 dark:text-brand-400">
              {service.priceRange}
            </p>
            <div className="mt-5 space-y-2.5">
              <Button className="w-full bg-[#25D366] text-white hover:bg-[#20bd5a]" asChild>
                <a href={whatsappUrl(SITE.whatsapp, `Hi ${service.name}, I found you on CarVista.`)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
                </a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>
                  <Phone className="h-4 w-4" /> Call now
                </a>
              </Button>
              <Button variant="gradient" className="w-full">Book an appointment</Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
