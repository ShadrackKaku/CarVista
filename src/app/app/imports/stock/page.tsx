import type { Metadata } from "next";
import { StockBrowser } from "@/components/import-stock/stock-browser";
import { getImportStock } from "@/lib/queries";

export const metadata: Metadata = { title: "Cars ready to import" };
export const dynamic = "force-dynamic";

export default async function AppImportStockPage() {
  const listings = await getImportStock();
  return <StockBrowser listings={listings} basePath="/app/imports/stock" />;
}
