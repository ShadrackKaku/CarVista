import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ServicesBrowser } from "@/components/services/services-browser";
import { getServices } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Automotive Services in Ghana — Mechanics, Detailing & More",
  description:
    "Find trusted mechanics, auto electricians, spray painters, car wash, detailing, insurance, driving schools and vehicle inspection services across Ghana.",
  alternates: { canonical: "/services" },
};

export const revalidate = 60;

export default async function ServicesPage() {
  const services = await getServices();
  return (
    <div>
      <PageHeader
        eyebrow="Services Marketplace"
        title="Automotive Services Near You"
        description="From routine servicing to full detailing — find and book trusted automotive professionals across Ghana."
      />
      <div className="container-page py-10">
        <ServicesBrowser services={services} />
      </div>
    </div>
  );
}
