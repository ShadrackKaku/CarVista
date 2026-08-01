import type { Metadata } from "next";
import { ShippingCalculator } from "@/components/calculators/shipping-calculator";

export const metadata: Metadata = {
  title: "Vehicle Shipping Calculator to Ghana",
  description:
    "Estimate RoRo and container shipping costs and transit times for importing a vehicle to Tema Port, Ghana.",
};

export default function ShippingPage() {
  return (
    <div>
      <ShippingCalculator />
    </div>
  );
}
