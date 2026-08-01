import type { Metadata } from "next";
import { FinancingCalculator } from "@/components/calculators/financing-calculator";
import { ToolHeader } from "@/components/tools/tool-header";

export const metadata: Metadata = {
  title: "Car Financing Calculator",
  description:
    "Estimate your monthly car loan payments in Ghana. Adjust down payment, interest rate and term to see your amortisation schedule.",
  alternates: { canonical: "/calculators/financing" },
};

export default function FinancingPage() {
  return (
    <div>
      <ToolHeader
        title="Financing & repayments"
        description="Plan your purchase. See your monthly payment, total interest and full amortisation schedule for any vehicle."
      />
      <FinancingCalculator />
    </div>
  );
}
