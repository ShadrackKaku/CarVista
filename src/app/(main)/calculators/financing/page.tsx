import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { FinancingCalculator } from "@/components/calculators/financing-calculator";

export const metadata: Metadata = {
  title: "Car Financing Calculator",
  description:
    "Estimate your monthly car loan payments in Ghana. Adjust down payment, interest rate and term to see your amortisation schedule.",
  alternates: { canonical: "/calculators/financing" },
};

export default function FinancingPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Calculators"
        title="Car Financing Calculator"
        description="Plan your purchase. See your monthly payment, total interest and full amortisation schedule for any vehicle."
      />
      <div className="container-page py-10">
        <FinancingCalculator />
      </div>
    </div>
  );
}
