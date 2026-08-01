import type { Metadata } from "next";
import { ServiceDetail } from "@/components/services/service-detail";
import { getServiceBySlug } from "@/lib/queries";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const service = await getServiceBySlug(params.slug);
  if (!service) return { title: "Service not found" };
  return {
    title: `${service.name} — ${service.typeLabel} in ${service.city}`,
    description: `${service.name} offers ${service.services.join(", ")} in ${service.city}, Ghana.`,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

/** The public, indexable profile. Signed-in users get the same view in-shell. */
export default function ServiceDetailPage({ params }: { params: { slug: string } }) {
  return <ServiceDetail slug={params.slug} />;
}
