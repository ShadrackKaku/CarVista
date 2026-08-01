import type { Metadata } from "next";
import { PartsBrowser } from "@/components/parts/parts-browser";
import { getParts } from "@/lib/queries";

export const metadata: Metadata = { title: "Parts" };
export const dynamic = "force-dynamic";

export default async function AppPartsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const parts = await getParts();
  return (
    <PartsBrowser
      parts={parts}
      initialCategory={searchParams.category ?? ""}
      basePath="/app/marketplace/parts"
    />
  );
}
