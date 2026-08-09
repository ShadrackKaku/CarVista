import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StockDetail } from "@/components/import-stock/stock-detail";
import { getImportStockBySlug } from "@/lib/queries";
import { estimateDutyForListing } from "@/lib/import-stock-server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const listing = await getImportStockBySlug(params.slug);
  return { title: listing?.title ?? "Import stock" };
}

export default async function AppStockDetailPage({ params }: { params: { slug: string } }) {
  const listing = await getImportStockBySlug(params.slug);
  if (!listing) notFound();

  const duty = await estimateDutyForListing(listing);
  return <StockDetail listing={listing} duty={duty} />;
}
