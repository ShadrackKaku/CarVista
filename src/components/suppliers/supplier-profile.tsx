import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Clock, Globe, MapPin, MessageCircle, Package, Phone, ShieldCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { SupplierEnquiryDialog } from "@/components/suppliers/supplier-enquiry-dialog";
import { getSupplierBySlug } from "@/lib/queries";
import { SUPPLIER_CATEGORY_LABELS } from "@/lib/suppliers";
import { whatsappUrl } from "@/lib/utils";
import { SITE } from "@/lib/constants";

export interface SupplierProfileProps {
  slug: string;
  /** Rendered inside the shell — see VehicleDetail for why this flag exists. */
  inShell?: boolean;
}

/** A supplier's profile, shared by the public page and the in-shell one. */
export async function SupplierProfile({ slug, inShell = false }: SupplierProfileProps) {
  const supplier = await getSupplierBySlug(slug);
  if (!supplier) notFound();

  const listBase = inShell ? "/app/marketplace/suppliers" : "/suppliers";

  return (
    <div className={inShell ? "" : "container-page py-8"}>
      <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground">
        {inShell ? (
          <Link href="/app/marketplace" className="hover:text-foreground">
            Marketplace
          </Link>
        ) : (
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
        )}
        <span>/</span>
        <Link href={listBase} className="hover:text-foreground">
          Suppliers
        </Link>
        <span>/</span>
        <span className="truncate text-foreground">{supplier.name}</span>
      </nav>

      <div className={`relative h-44 sm:h-56 ${inShell ? "overflow-hidden rounded-2xl" : ""}`}>
        <Image src={supplier.cover} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
      </div>

      <div className="-mt-14 flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-card sm:flex-row sm:items-end">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-background">
          <Image src={supplier.logo} alt={supplier.name} fill sizes="96px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{supplier.name}</h1>
            {supplier.verified && (
              <Badge variant="brand">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </Badge>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {supplier.city && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {supplier.city}
                {supplier.region ? `, ${supplier.region}` : ""}
              </span>
            )}
            {supplier.reviewCount > 0 && (
              <StarRating rating={supplier.rating} reviewCount={supplier.reviewCount} showValue />
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          {supplier.description && (
            <section>
              <h2 className="text-xl font-bold">About</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{supplier.description}</p>
            </section>
          )}

          {supplier.categories.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-bold">What they supply</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {supplier.categories.map((c) => (
                  <span key={c} className="rounded-full border bg-card px-3.5 py-1.5 text-sm">
                    {SUPPLIER_CATEGORY_LABELS[c] ?? c}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-5">
              <h3 className="flex items-center gap-2 font-semibold">
                <Package className="h-4 w-4 text-brand-500" /> Order terms
              </h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Minimum order</dt>
                  <dd className="text-right font-medium">
                    {supplier.minimumOrder ?? "Ask them"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Lead time</dt>
                  <dd className="text-right font-medium">
                    {supplier.leadTimeDays != null ? `${supplier.leadTimeDays} days` : "Ask them"}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <h3 className="flex items-center gap-2 font-semibold">
                <Truck className="h-4 w-4 text-brand-500" /> Delivers to
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                {supplier.servesRegions.length > 0
                  ? supplier.servesRegions.join(", ")
                  : "Nationwide"}
              </p>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-6 shadow-soft lg:sticky lg:top-0">
            <p className="text-sm font-semibold">Buying wholesale?</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Wholesale pricing depends on quantity and terms, so there is no list price. Send them
              what you need and they will quote it.
            </p>
            <div className="mt-5 space-y-2.5">
              <SupplierEnquiryDialog supplierId={supplier.id} supplierName={supplier.name} />
              {supplier.whatsapp && (
                <Button asChild className="w-full bg-[#25D366] text-white hover:bg-[#20bd5a]">
                  <a
                    href={whatsappUrl(supplier.whatsapp, `Hi ${supplier.name}, I found you on ${SITE.name}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              )}
              {supplier.phone && (
                <Button asChild variant="outline" className="w-full">
                  <a href={`tel:${supplier.phone.replace(/\s/g, "")}`}>
                    <Phone className="h-4 w-4" /> Call
                  </a>
                </Button>
              )}
              {supplier.website && (
                <Button asChild variant="ghost" className="w-full">
                  <a href={supplier.website} target="_blank" rel="noopener noreferrer nofollow">
                    <Globe className="h-4 w-4" /> Website
                  </a>
                </Button>
              )}
            </div>
            {!supplier.verified && (
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                This supplier has not completed verification yet. Check their documents before
                sending money.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
