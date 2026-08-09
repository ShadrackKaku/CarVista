import type { Metadata } from "next";
import Link from "next/link";
import { StockBrowser } from "@/components/import-stock/stock-browser";
import { getImportStock } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Cars ready to import to Ghana — priced landed in Tema",
  description:
    "Stock Ghanaian importers already have access to, with duty and levies estimated from real GRA assessments — not just the FOB price you see on Japanese auction sites.",
  alternates: { canonical: "/import/stock" },
};

// Stock and its held counts change through the day, so this is rendered per
// request. The sitemap carries the URLs for crawling.
export const dynamic = "force-dynamic";

/**
 * The public, crawlable stock browse.
 *
 * SBT Japan and BE FORWARD are found because their stock pages are indexed —
 * somebody searches "2019 Toyota Harrier import Ghana" and lands on a car. The
 * in-shell twin at /app/imports/stock cannot do that, because a crawler never
 * signs in. Middleware moves a signed-in visitor to the twin, so this page only
 * ever serves people who are logged out.
 */
export default async function PublicImportStockPage() {
  const listings = await getImportStock();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 max-w-3xl">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Cars ready to import
        </h1>
        <p className="mt-3 text-muted-foreground">
          Stock Ghanaian importers already have access to. Every car is priced the way it
          actually costs you — FOB, shipping to Tema, and duty estimated from real GRA
          assessments — rather than the port-of-loading price alone.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Want something not listed here?{" "}
          <Link href="/import" className="font-medium text-brand-600 hover:underline">
            Tell us what to look for
          </Link>{" "}
          and importers will quote you.
        </p>
      </header>

      <StockBrowser listings={listings} basePath="/import/stock" />
    </div>
  );
}
