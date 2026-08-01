import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check, Package, ShieldCheck, Truck, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "@/components/star-rating";
import { AddToCartButton } from "@/components/parts/add-to-cart-button";
import { BuyNowButton } from "@/components/parts/buy-now-button";
import { PartCard } from "@/components/parts/part-card";
import { getPartBySlug, getParts } from "@/lib/queries";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { formatCurrency, safeJsonLd } from "@/lib/utils";
import { breadcrumbJsonLd } from "@/lib/seo";
import { sanitizeRichHtml } from "@/lib/sanitize";

export interface PartDetailProps {
  slug: string;
  /** Rendered inside the authenticated shell — see VehicleDetail for why. */
  inShell?: boolean;
}

/** The part detail view, shared by the public page and the in-shell one. */
export async function PartDetail({ slug, inShell = false }: PartDetailProps) {
  const part = await getPartBySlug(slug);
  if (!part) notFound();

  const partsBase = inShell ? "/app/marketplace/parts" : "/parts";

  const hasDiscount = part.discountPrice && part.discountPrice < part.price;
  const related = (await getParts())
    .filter((p) => p.categorySlug === part.categorySlug && p.id !== part.id)
    .slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: part.name,
    brand: { "@type": "Brand", name: part.brand },
    mpn: part.oemNumber,
    offers: {
      "@type": "Offer",
      price: hasDiscount ? part.discountPrice : part.price,
      priceCurrency: "GHS",
      availability: part.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: part.rating,
      reviewCount: part.reviewCount,
    },
    image: part.image,
  };

  return (
    <div className={inShell ? "" : "container-page py-8"}>
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
                  { name: "Parts", path: "/parts" },
                  { name: part.category, path: `/parts?category=${part.categorySlug}` },
                  { name: part.name },
                ]),
              ),
            }}
          />
        </>
      )}

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
        <Link href={partsBase} className="hover:text-foreground">
          Parts
        </Link>
        <span>/</span>
        <Link href={`${partsBase}?category=${part.categorySlug}`} className="hover:text-foreground">
          {part.category}
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted">
          <Image src={part.image} alt={part.name} fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
          {hasDiscount && (
            <Badge variant="destructive" className="absolute left-4 top-4">
              Save {formatCurrency(part.price - part.discountPrice!)}
            </Badge>
          )}
        </div>

        <div>
          <span className="text-sm font-medium text-brand-600">{part.brand}</span>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {part.name}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <StarRating rating={part.rating} reviewCount={part.reviewCount} showValue />
            <span className="text-sm text-muted-foreground">·</span>
            <span className="text-sm capitalize text-muted-foreground">{part.condition.toLowerCase()}</span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold text-brand-700 dark:text-brand-400">
              {formatCurrency(hasDiscount ? part.discountPrice! : part.price)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-muted-foreground line-through">
                {formatCurrency(part.price)}
              </span>
            )}
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-sm">
            {part.stock > 0 ? (
              <span className="flex items-center gap-1.5 font-medium text-success">
                <Check className="h-4 w-4" /> In stock ({part.stock} available)
              </span>
            ) : (
              <span className="font-medium text-destructive">Out of stock</span>
            )}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <AddToCartButton part={part} size="lg" className="flex-1" />
            <BuyNowButton part={part} size="lg" className="flex-1" />
          </div>

          {/* Compatibility */}
          <div className="mt-6 rounded-xl border bg-card p-4">
            <h3 className="text-sm font-semibold">Compatibility & fitment</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Compatible makes</dt>
                <dd className="font-medium">{part.compatibleMakes.join(", ")}</dd>
              </div>
              {part.oemNumber && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">OEM number</dt>
                  <dd className="font-mono font-medium">{part.oemNumber}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium">{part.category}</dd>
              </div>
            </dl>
          </div>

          {/* Seller + trust */}
          <div className="mt-4 flex items-center justify-between rounded-xl border bg-card p-4">
            <div className="flex items-center gap-1.5 text-sm">
              {part.store.verified && <ShieldCheck className="h-4 w-4 text-success" />}
              <span className="text-muted-foreground">Sold by</span>
              <span className="font-semibold">{part.store.name}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
            <div className="rounded-lg border p-3">
              <Truck className="mx-auto h-5 w-5 text-brand-500" />
              <p className="mt-1.5">Nationwide delivery</p>
            </div>
            <div className="rounded-lg border p-3">
              <Undo2 className="mx-auto h-5 w-5 text-brand-500" />
              <p className="mt-1.5">7-day returns</p>
            </div>
            <div className="rounded-lg border p-3">
              <Package className="mx-auto h-5 w-5 text-brand-500" />
              <p className="mt-1.5">Genuine parts</p>
            </div>
          </div>
        </div>
      </div>

      {part.description && (
        <section className="mt-10 max-w-3xl">
          <h2 className="text-xl font-bold">Description</h2>
          <div
            className="blog-prose mt-3"
            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(part.description) }}
          />
        </section>
      )}

      <ReviewsSection targetType="part" targetId={part.id} />

      {related.length > 0 && (
        <section className="mt-14">
          <Separator className="mb-8" />
          <h2 className="mb-6 text-2xl font-bold">Related parts</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <PartCard key={p.id} part={p} basePath={partsBase} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
