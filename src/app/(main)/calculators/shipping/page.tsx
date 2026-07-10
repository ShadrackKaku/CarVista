import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ShippingCalculator } from "@/components/calculators/shipping-calculator";

export const metadata: Metadata = {
  title: "Vehicle Shipping Calculator to Ghana",
  description:
    "Estimate RoRo and container shipping costs and transit times for importing a vehicle to Tema Port, Ghana.",
  alternates: { canonical: "/calculators/shipping" },
};

export default function ShippingPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Calculators"
        title="Shipping Cost Calculator"
        description="Compare RoRo and container shipping costs and transit times from major ports to Tema, Ghana."
      />
      <div className="container-page py-10">
        <ShippingCalculator />
      </div>
    </div>
  );
}
