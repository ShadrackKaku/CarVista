import type { Metadata } from "next";
import { VehicleDetail } from "@/components/vehicles/vehicle-detail";
import { getVehicleBySlug } from "@/lib/queries";
import { formatNumber } from "@/lib/utils";
import { stripHtml } from "@/lib/sanitize";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const vehicle = await getVehicleBySlug(params.slug);
  if (!vehicle) return { title: "Vehicle not found" };
  // The description may now be rich HTML — strip tags for the meta/OG text.
  const description =
    stripHtml(vehicle.description ?? "") ||
    `${vehicle.year} ${vehicle.title} for sale in ${vehicle.city}, Ghana — ${formatNumber(
      vehicle.mileage,
    )} km, ${vehicle.transmission.toLowerCase()}, ${vehicle.fuelType.toLowerCase()}. View photos, full specs and price on CarVista.`;
  const image = vehicle.images[0];
  return {
    title: `${vehicle.title} for sale in ${vehicle.city}`,
    description,
    alternates: { canonical: `/vehicles/${vehicle.slug}` },
    openGraph: {
      type: "website",
      title: vehicle.title,
      description,
      url: `/vehicles/${vehicle.slug}`,
      images: [{ url: image, alt: vehicle.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: vehicle.title,
      description,
      images: [image],
    },
  };
}

/** The public, indexable listing. Signed-in users get the same view in-shell. */
export default function VehicleDetailPage({ params }: { params: { slug: string } }) {
  return <VehicleDetail slug={params.slug} />;
}
