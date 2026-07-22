import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PartsBrowser } from "@/components/parts/parts-browser";
import { getParts } from "@/lib/queries";
import { hasActiveFilters } from "@/lib/seo";

export function generateMetadata({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): Metadata {
  const filtered = hasActiveFilters(searchParams);
  return {
    title: "Car Parts Marketplace — Genuine & OEM Spare Parts in Ghana",
    description:
      "Shop genuine and OEM car spare parts in Ghana. Search by vehicle make, model, category and OEM number. Engine, brake, suspension parts, tyres, batteries and more.",
    alternates: { canonical: "/parts" },
    // Category/filter permutations canonicalise to /parts and are noindexed.
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export const dynamic = "force-dynamic";

export default async function PartsPage({ searchParams }: { searchParams: { category?: string } }) {
  const parts = await getParts();
  return (
    <div>
      <PageHeader
        eyebrow="Marketplace"
        title="Car Parts Marketplace"
        description="Genuine and OEM spare parts for every vehicle — with fitment search so you order the exact part that fits your car."
      />
      <div className="container-page py-10">
        <PartsBrowser parts={parts} initialCategory={searchParams.category ?? ""} />
      </div>
    </div>
  );
}
