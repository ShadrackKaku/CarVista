import type { Metadata } from "next";
import { ServicesBrowser } from "@/components/services/services-browser";
import { getServices } from "@/lib/queries";

export const metadata: Metadata = { title: "Services" };
export const dynamic = "force-dynamic";

export default async function AppServicesPage() {
  const services = await getServices();
  return <ServicesBrowser services={services} basePath="/app/marketplace/services" />;
}
