import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PartsBrowser } from "@/components/parts/parts-browser";
import { SAMPLE_PARTS } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Car Parts Marketplace — Genuine & OEM Spare Parts in Ghana",
  description:
    "Shop genuine and OEM car spare parts in Ghana. Search by vehicle make, model, category and OEM number. Engine, brake, suspension parts, tyres, batteries and more.",
  alternates: { canonical: "/parts" },
};

export default function PartsPage({ searchParams }: { searchParams: { category?: string } }) {
  return (
    <div>
      <PageHeader
        eyebrow="Marketplace"
        title="Car Parts Marketplace"
        description="Genuine and OEM spare parts for every vehicle — with fitment search so you order the exact part that fits your car."
      />
      <div className="container-page py-10">
        <PartsBrowser parts={SAMPLE_PARTS} initialCategory={searchParams.category ?? ""} />
      </div>
    </div>
  );
}
