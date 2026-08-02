import type { Metadata } from "next";
import { ServiceDetail } from "@/components/services/service-detail";
import { getServiceBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const service = await getServiceBySlug(params.slug);
  return { title: service?.name ?? "Service provider" };
}

export default function AppServiceDetailPage({ params }: { params: { slug: string } }) {
  return <ServiceDetail slug={params.slug} inShell />;
}
