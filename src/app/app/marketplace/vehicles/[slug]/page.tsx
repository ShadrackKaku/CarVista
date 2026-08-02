import type { Metadata } from "next";
import { VehicleDetail } from "@/components/vehicles/vehicle-detail";
import { getVehicleBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const vehicle = await getVehicleBySlug(params.slug);
  return { title: vehicle?.title ?? "Vehicle" };
}

/**
 * Opening a car from the Marketplace module keeps the shell: same view as the
 * public page, rendered between the sidebars instead of the marketing header.
 */
export default function AppVehicleDetailPage({ params }: { params: { slug: string } }) {
  return <VehicleDetail slug={params.slug} inShell />;
}
