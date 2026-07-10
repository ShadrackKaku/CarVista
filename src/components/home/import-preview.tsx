import Link from "next/link";
import { ArrowRight, Ship, Anchor, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateDuty } from "@/lib/duty-calculator";
import { formatCurrency } from "@/lib/utils";

const stages = [
  { icon: Ship, label: "Purchased at auction" },
  { icon: Anchor, label: "Shipped to Tema Port" },
  { icon: ShieldCheck, label: "Customs cleared" },
  { icon: Truck, label: "Delivered to you" },
];

export function ImportPreview() {
  // Sample: 2021 Toyota Camry, CIF $14,000
  const sample = calculateDuty({
    cifValue: 14000,
    currency: "USD",
    exchangeRate: 15.5,
    manufactureYear: 2021,
    engineSizeCc: 2500,
    fuelType: "PETROL",
    bodyType: "SEDAN",
    shippingCost: 18000,
  });

  const highlights = sample.lineItems.filter((li) =>
    ["cif", "importDuty", "vat", "shipping"].includes(li.key),
  );

  return (
    <section className="container-page py-16">
      <div className="grid items-center gap-10 rounded-3xl border bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white sm:p-12 lg:grid-cols-2">
        <div>
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            Ghana Import Calculator
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">
            Know your total landed cost — before you buy.
          </h2>
          <p className="mt-4 text-brand-100">
            Our calculator uses current GRA duty rates, VAT, NHIL, GETFund and port charges to give
            you an accurate estimate in seconds. No surprises at the port.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stages.map((stage, i) => (
              <div key={i} className="flex flex-col items-center gap-2 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
                  <stage.icon className="h-5 w-5" />
                </span>
                <span className="text-[11px] leading-tight text-brand-100">{stage.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-brand-700 hover:bg-brand-50">
              <Link href="/calculators/import-duty">
                Calculate My Duty <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/import">Start an Import</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 text-foreground shadow-2xl">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <p className="text-sm text-muted-foreground">Sample estimate</p>
              <p className="font-semibold">2021 Toyota Camry · 2.5L</p>
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              CIF $14,000
            </span>
          </div>
          <div className="space-y-3 py-4">
            {highlights.map((li) => (
              <div key={li.key} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{li.label}</span>
                <span className="font-medium">{formatCurrency(li.amount)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <span className="font-semibold">Total Landed Cost</span>
            <span className="font-display text-xl font-bold text-brand-700">
              {formatCurrency(sample.totalLandedCost)}
            </span>
          </div>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Estimate only. Final assessment by GRA Customs (ICUMS).
          </p>
        </div>
      </div>
    </section>
  );
}
