import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ServicesBrowser } from "@/components/services/services-browser";
import { SAMPLE_SERVICES } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Automotive Services in Ghana — Mechanics, Detailing & More",
  description:
    "Find trusted mechanics, auto electricians, spray painters, car wash, detailing, insurance, driving schools and vehicle inspection services across Ghana.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Services Marketplace"
        title="Automotive Services Near You"
        description="From routine servicing to full detailing — find and book trusted automotive professionals across Ghana."
      />
      <div className="container-page py-10">
        <ServicesBrowser services={SAMPLE_SERVICES} />
      </div>
    </div>
  );
}
