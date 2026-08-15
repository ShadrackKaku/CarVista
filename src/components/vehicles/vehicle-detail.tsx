import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Fuel,
  Gauge,
  Settings2,
  Palette,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Car,
  Ship,
  FileText,
} from "lucide-react";
import { VehicleGallery } from "@/components/vehicles/vehicle-gallery";
import { VehicleVideo } from "@/components/vehicles/vehicle-video";
import { SellerContact } from "@/components/vehicles/seller-contact";
import { ContactSellerDialog } from "@/components/messages/contact-seller-dialog";
import { InspectionBookingDialog } from "@/components/bookings/inspection-booking-dialog";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { VehiclePassport } from "@/components/vehicles/vehicle-passport";
import { VehicleProvenance } from "@/components/vehicles/vehicle-provenance";
import { FinancingWidget } from "@/components/vehicles/financing-widget";
import { SaveVehicleButton } from "@/components/vehicles/save-vehicle-button";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { ViewBeacon } from "@/components/vehicles/view-beacon";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getVehicleBySlug, getSimilarVehicles } from "@/lib/queries";
import { calculateDuty } from "@/lib/duty-calculator";
import { formatCurrency, formatNumber, safeJsonLd } from "@/lib/utils";
import { breadcrumbJsonLd } from "@/lib/seo";
import { sanitizeRichHtml } from "@/lib/sanitize";

const CONDITION_LABELS: Record<string, string> = {
  NEW: "Brand New",
  FOREIGN_USED: "Foreign Used",
  GHANA_USED: "Ghana Used",
  SALVAGE: "Salvage",
};

export interface VehicleDetailProps {
  slug: string;
  /**
   * Rendered inside the authenticated shell rather than on the public site.
   *
   * Two things change. Links stay in the shell — a car opened from the
   * Marketplace module must not eject the user back onto the marketing site.
   * And the SEO furniture (JSON-LD, marketing breadcrumb) is dropped: the
   * public page is the canonical one, so emitting a second copy behind auth
   * would only give crawlers a duplicate they can never reach.
   */
  inShell?: boolean;
}

/**
 * The vehicle detail view, shared by the public page and the in-shell one.
 *
 * It owns its own data fetching so both call sites stay three lines long; the
 * public page still resolves the vehicle separately for `generateMetadata`,
 * which runs before render and cannot read from here.
 */
export async function VehicleDetail({ slug, inShell = false }: VehicleDetailProps) {
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) notFound();

  const vehiclesBase = inShell ? "/app/marketplace/vehicles" : "/vehicles";
  const calculatorsBase = inShell ? "/app/calculators" : "/calculators";

  const canImport = vehicle.importStatus === "AVAILABLE_FOR_IMPORT";
  const duty = canImport
    ? calculateDuty({
        cifValue: Math.round((vehicle.price / 15.5) * 0.85),
        currency: "USD",
        exchangeRate: 15.5,
        manufactureYear: vehicle.year,
        engineSizeCc: Math.round(vehicle.engineSize * 1000),
        fuelType: vehicle.fuelType as never,
        bodyType: vehicle.bodyType as never,
        shippingCost: 18000,
      })
    : null;

  const specs = [
    { icon: Calendar, label: "Year", value: vehicle.year },
    { icon: Gauge, label: "Mileage", value: `${formatNumber(vehicle.mileage)} km` },
    { icon: Fuel, label: "Fuel", value: vehicle.fuelType.toLowerCase() },
    { icon: Settings2, label: "Transmission", value: vehicle.transmission.toLowerCase() },
    { icon: Car, label: "Body type", value: vehicle.bodyType.toLowerCase() },
    { icon: Palette, label: "Colour", value: vehicle.color },
  ];

  const similar = await getSimilarVehicles(vehicle.slug, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: vehicle.title,
    brand: { "@type": "Brand", name: vehicle.brand },
    model: vehicle.model,
    vehicleModelDate: vehicle.year,
    mileageFromOdometer: { "@type": "QuantitativeValue", value: vehicle.mileage, unitCode: "KMT" },
    fuelType: vehicle.fuelType,
    color: vehicle.color,
    offers: {
      "@type": "Offer",
      price: vehicle.price,
      priceCurrency: "GHS",
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: vehicle.dealer.name },
    },
    image: vehicle.images,
  };

  return (
    <div className={inShell ? "" : "container-page py-8"}>
      <ViewBeacon vehicleId={vehicle.id} />

      {!inShell && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: safeJsonLd(
                breadcrumbJsonLd([
                  { name: "Home", path: "/" },
                  { name: "Vehicles", path: "/vehicles" },
                  { name: vehicle.title },
                ]),
              ),
            }}
          />
        </>
      )}

      {/* Breadcrumb */}
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
        <Link href={vehiclesBase} className="hover:text-foreground">
          Vehicles
        </Link>
        <span>/</span>
        <span className="truncate text-foreground">{vehicle.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <VehicleGallery images={vehicle.images} title={vehicle.title} />

          {/* Title + price */}
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="brand">{CONDITION_LABELS[vehicle.condition]}</Badge>
                {vehicle.verified && (
                  <Badge variant="success">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </Badge>
                )}
                {vehicle.auctionGrade && (
                  <Badge variant="secondary">Auction Grade {vehicle.auctionGrade}</Badge>
                )}
              </div>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
                {vehicle.title}
              </h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {vehicle.location}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-bold text-brand-700 dark:text-brand-400">
                {formatCurrency(vehicle.price)}
              </p>
              <div className="mt-2 flex justify-end">
                <SaveVehicleButton vehicleId={vehicle.id} />
              </div>
            </div>
          </div>

          {/* Specs grid */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {specs.map((spec) => (
              <div key={spec.label} className="rounded-xl border bg-card p-4">
                <spec.icon className="h-5 w-5 text-brand-500" />
                <p className="mt-2 text-xs text-muted-foreground">{spec.label}</p>
                <p className="font-semibold capitalize">{spec.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <section className="mt-8">
            <h2 className="text-xl font-bold">Description</h2>
            {vehicle.description ? (
              <div
                className="blog-prose mt-3"
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(vehicle.description) }}
              />
            ) : (
              <p className="mt-3 leading-relaxed text-muted-foreground">No description provided.</p>
            )}
          </section>

          {/* Video */}
          {vehicle.videoUrl && (
            <section className="mt-8">
              <h2 className="text-xl font-bold">Video walk-around</h2>
              <div className="mt-3">
                <VehicleVideo url={vehicle.videoUrl} title={vehicle.title} />
              </div>
            </section>
          )}

          {/* Features */}
          <section className="mt-8">
            <h2 className="text-xl font-bold">Features &amp; equipment</h2>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {vehicle.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  {f}
                </div>
              ))}
            </div>
          </section>

          {/* History / import */}
          <section className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-5">
              <h3 className="flex items-center gap-2 font-semibold">
                <FileText className="h-4 w-4 text-brand-500" /> Vehicle history
              </h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">VIN</dt>
                  <dd className="font-medium">{vehicle.vin ?? "Available on request"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Service history</dt>
                  <dd className="font-medium text-success">Available</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Accident history</dt>
                  <dd className="font-medium text-success">Clean</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <h3 className="flex items-center gap-2 font-semibold">
                <Ship className="h-4 w-4 text-brand-500" /> Import status
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                {vehicle.importStatus === "CLEARED"
                  ? "This vehicle is already in Ghana with duty paid — ready for registration and delivery."
                  : vehicle.importStatus === "AVAILABLE_FOR_IMPORT"
                    ? "Available to import to order. See the estimated landed cost below."
                    : vehicle.importStatus === "IMPORT_IN_PROGRESS"
                      ? "Currently being imported. Contact the seller for the latest tracking update."
                      : "Local vehicle."}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Origin: {vehicle.countryOfOrigin ?? "—"}
              </p>
            </div>
          </section>

          {/* Duty estimate for importable vehicles */}
          {duty && (
            <section className="mt-8 rounded-2xl border bg-gradient-to-br from-brand-50 to-background p-6 dark:from-brand-900/20">
              <h2 className="text-xl font-bold">Estimated landed cost (import to order)</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Based on current GRA duty rates. Final assessment by Customs.
              </p>
              <div className="mt-4 space-y-2">
                {duty.lineItems
                  .filter((li) => ["cif", "importDuty", "vat", "shipping"].includes(li.key))
                  .map((li) => (
                    <div key={li.key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{li.label}</span>
                      <span className="font-medium">{formatCurrency(li.amount)}</span>
                    </div>
                  ))}
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="font-semibold">Total landed cost</span>
                  <span className="font-display text-lg font-bold text-brand-700">
                    {formatCurrency(duty.totalLandedCost)}
                  </span>
                </div>
              </div>
              {/* Deep-link the data-backed estimator with this exact car, so
                  the user lands on a real quote rather than an empty form. */}
              <Link
                href={`${calculatorsBase}/import-duty?make=${encodeURIComponent(
                  vehicle.brand,
                )}&model=${encodeURIComponent(vehicle.model)}&year=${vehicle.year}`}
                className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline"
              >
                Estimate landed cost for this car →
              </Link>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="lg:sticky lg:top-6 lg:space-y-5">
            <SellerContact
              dealerName={vehicle.dealer.name}
              verified={vehicle.dealer.verified}
              vehicleTitle={vehicle.title}
              price={formatCurrency(vehicle.price)}
            >
              <ContactSellerDialog
                recipientId={vehicle.sellerId}
                vehicleId={vehicle.id}
                vehicleTitle={vehicle.title}
              />
              <InspectionBookingDialog
                vehicleTitle={vehicle.title}
                triggerLabel="Book an inspection"
                triggerVariant="ghost"
                className="w-full"
              />
            </SellerContact>
            <FinancingWidget
              price={vehicle.price}
              calculatorHref={inShell ? `${calculatorsBase}/financing` : "/calculators"}
            />
          </div>
        </aside>
      </div>

      {/* What this car can prove about where it came from. Absent entirely for
          a vehicle we did not import, which is what makes its presence mean
          something. */}
      <VehicleProvenance vehicleId={vehicle.id} />

      {/* Vehicle Passport — verified history timeline */}
      <VehiclePassport vehicleId={vehicle.id} sellerId={vehicle.sellerId} />

      {/* Reviews */}
      <ReviewsSection targetType="vehicle" targetId={vehicle.id} />

      {/* Similar vehicles */}
      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 text-2xl font-bold">Similar vehicles</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((v) => (
              <VehicleCard key={v.id} vehicle={v} basePath={vehiclesBase} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
