import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { DutyCalculator } from "@/components/calculators/duty-calculator";
import { SmartLandedCost } from "@/components/calculators/smart-landed-cost";
import { LiveRates } from "@/components/calculators/live-rates";

export const metadata: Metadata = {
  title: "Ghana Import Duty Calculator",
  description:
    "Calculate the exact import duty, VAT, NHIL, GETFund and total landed cost of importing a vehicle into Ghana. Free and instant.",
  alternates: { canonical: "/calculators/import-duty" },
};

export default function ImportDutyPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Calculators"
        title="Ghana Import Duty Calculator"
        description="Know the full landed cost of your import before you commit. Uses current GRA duty rates, levies, and port charges — updated by our team."
      />
      <div className="container-page py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-8">
            <SmartLandedCost />
            <div>
              <h2 className="mb-4 font-display text-xl font-bold">Classic calculator</h2>
              <DutyCalculator />
            </div>
          </div>
          <div className="space-y-6">
            <LiveRates />
            <div className="rounded-2xl border bg-brand-600 p-6 text-white">
              <h3 className="font-semibold">Need help importing?</h3>
              <p className="mt-2 text-sm text-brand-100">
                Our team can source, ship, clear and deliver your vehicle — end to end.
              </p>
              <Link
                href="/import"
                className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
              >
                Start an import
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
