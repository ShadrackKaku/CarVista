import { Suspense } from "react";
import type { Metadata } from "next";
import { DutyCalculator } from "@/components/calculators/duty-calculator";
import { SmartLandedCost } from "@/components/calculators/smart-landed-cost";
import { LiveRates } from "@/components/calculators/live-rates";

export const metadata: Metadata = {
  title: "Ghana Import Duty Calculator",
  description:
    "Calculate the exact import duty, VAT, NHIL, GETFund and total landed cost of importing a vehicle into Ghana. Free and instant.",
};

export default function ImportDutyPage() {
  return (
    <div>

      <div className="grid gap-8 xl:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-8">
          <Suspense fallback={null}>
            <SmartLandedCost />
          </Suspense>
          <div>
            <h3 className="mb-4 font-display text-lg font-bold">Classic calculator</h3>
            <DutyCalculator />
          </div>
        </div>
        <div className="min-w-0">
          <LiveRates />
        </div>
      </div>
    </div>
  );
}
