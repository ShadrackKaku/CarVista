"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Slider } from "@/components/ui/slider";
import { calculateFinancing } from "@/lib/financing-calculator";
import { formatCurrency } from "@/lib/utils";

export function FinancingWidget({
  price,
  calculatorHref = "/calculators",
}: {
  price: number;
  /** Where "open the full calculator" goes — in-shell callers pass their own. */
  calculatorHref?: string;
}) {
  const [downPct, setDownPct] = useState(30);
  const [term, setTerm] = useState(36);
  const [rate] = useState(28);

  const result = useMemo(
    () =>
      calculateFinancing({
        vehiclePrice: price,
        downPayment: (price * downPct) / 100,
        annualRatePercent: rate,
        termMonths: term,
      }),
    [price, downPct, term, rate],
  );

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <h3 className="font-semibold">Financing estimate</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Indicative at {rate}% APR from partner lenders.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Down payment</span>
            <span className="font-semibold">
              {downPct}% · {formatCurrency((price * downPct) / 100)}
            </span>
          </div>
          <Slider
            defaultValue={[downPct]}
            min={10}
            max={70}
            step={5}
            onValueChange={([v]) => setDownPct(v)}
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Loan term</span>
            <span className="font-semibold">{term} months</span>
          </div>
          <Slider
            defaultValue={[term]}
            min={12}
            max={60}
            step={6}
            onValueChange={([v]) => setTerm(v)}
          />
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-brand-50 p-4 text-center dark:bg-brand-900/30">
        <p className="text-xs text-muted-foreground">Estimated monthly payment</p>
        <p className="font-display text-2xl font-bold text-brand-700 dark:text-brand-300">
          {formatCurrency(result.monthlyPayment)}
        </p>
      </div>

      <Link
        href={calculatorHref}
        className="mt-3 block text-center text-xs font-medium text-brand-600 hover:underline"
      >
        Open full financing calculator →
      </Link>
    </div>
  );
}
