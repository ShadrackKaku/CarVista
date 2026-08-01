import type { Metadata } from "next";
import { FinancingCalculator } from "@/components/calculators/financing-calculator";

export const metadata: Metadata = {
  title: "Car Financing Calculator",
  description:
    "Estimate your monthly car loan payments in Ghana. Adjust down payment, interest rate and term to see your amortisation schedule.",
};

export default function FinancingPage() {
  return (
    <div>
      <FinancingCalculator />
    </div>
  );
}
