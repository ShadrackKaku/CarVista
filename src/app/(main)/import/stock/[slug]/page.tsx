import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StockDetail } from "@/components/import-stock/stock-detail";
import { getImportStockBySlug } from "@/lib/queries";
import { estimateDutyForListing } from "@/lib/import-stock-server";
import { stockPricing } from "@/lib/import-stock";
import { SITE } from "@/lib/constants";
import { safeJsonLd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const listing = await getImportStockBySlug(params.slug);
  if (!listing) return { title: "Import stock" };

  return {
    title: `${listing.title} — import to Ghana`,
    description: `${listing.title} from ${listing.countryOfOrigin}, available to import through ${listing.importer.name}. Priced landed in Tema: FOB, shipping and estimated duty.`,
    alternates: { canonical: `/import/stock/${listing.slug}` },
    openGraph: {
      title: listing.title,
      images: listing.images[0] ? [listing.images[0]] : undefined,
    },
  };
}

/**
 * The public, crawlable detail page for one car on an importer's shelf.
 *
 * Middleware sends signed-in visitors to /app/imports/stock/<slug>, so this
 * serves logged-out traffic and search engines.
 *
 * The Product schema advertises the *landed* price when we have one, not the
 * FOB. A search result promising GH₵208,250 for a car that costs GH₵332,433 on
 * the road is the exact bait-and-switch this whole feature exists to end — so
 * when the car cannot be fully priced, no `offers` block is emitted at all
 * rather than one built from the parts we happen to hold.
 */
export default async function PublicStockDetailPage({ params }: { params: { slug: string } }) {
  const listing = await getImportStockBySlug(params.slug);
  if (!listing) notFound();

  const duty = await estimateDutyForListing(listing);
  const pricing = stockPricing({
    fobAmount: listing.fobAmount,
    fobCurrency: listing.fobCurrency,
    fxRateToGhs: listing.fxRateToGhs,
    serviceFeeGhs: listing.serviceFeeGhs,
    freightGhs: listing.freightGhs,
    estimatedDutyGhs: duty?.ghs ?? null,
    dutyTier: duty?.tier ?? null,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    sku: listing.slug,
    brand: { "@type": "Brand", name: listing.make },
    model: listing.model,
    productionDate: String(listing.year),
    countryOfOrigin: listing.countryOfOrigin,
    ...(listing.images[0] ? { image: listing.images } : {}),
    ...(pricing.totalGhs != null
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "GHS",
            price: pricing.totalGhs,
            availability:
              listing.quantity - listing.held > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            url: `${SITE.url}/import/stock/${listing.slug}`,
            seller: { "@type": "Organization", name: listing.importer.name },
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <StockDetail listing={listing} duty={duty} />
    </div>
  );
}
