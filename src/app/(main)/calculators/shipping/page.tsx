import type { Metadata } from "next";
import { ShippingCalculator } from "@/components/calculators/shipping-calculator";
import { ToolHeader } from "@/components/tools/tool-header";

export const metadata: Metadata = {
  title: "Vehicle Shipping Calculator to Ghana",
  description:
    "Estimate RoRo and container shipping costs and transit times for importing a vehicle to Tema Port, Ghana.",
  alternates: { canonical: "/calculators/shipping" },
};

export default function ShippingPage() {
  return (
    <div>
      <ToolHeader
        title="Shipping cost"
        description="Compare RoRo and container shipping costs and transit times from major ports to Tema, Ghana."
      />
      <ShippingCalculator />
    </div>
  );
}
