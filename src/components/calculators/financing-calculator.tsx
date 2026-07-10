"use client";

import { useMemo, useState } from "react";
import { Banknote, Percent, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { calculateFinancing } from "@/lib/financing-calculator";
import { formatCurrency } from "@/lib/utils";

export function FinancingCalculator() {
  const [price, setPrice] = useState(300000);
  const [downPct, setDownPct] = useState(30);
  const [rate, setRate] = useState(28);
  const [term, setTerm] = useState(36);

  const result = useMemo(
    () =>
      calculateFinancing({
        vehiclePrice: price,
        downPayment: (price * downPct) / 100,
        annualRatePercent: rate,
        termMonths: term,
      }),
    [price, downPct, rate, term],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Banknote className="h-5 w-5 text-brand-500" /> Loan details
        </h2>
        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label>Vehicle price (GHS)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <Label>Down payment</Label>
              <span className="font-semibold">
                {downPct}% · {formatCurrency((price * downPct) / 100)}
              </span>
            </div>
            <Slider defaultValue={[downPct]} min={0} max={80} step={5} onValueChange={([v]) => setDownPct(v)} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <Label>Interest rate (APR)</Label>
              <span className="font-semibold">{rate}%</span>
            </div>
            <Slider defaultValue={[rate]} min={10} max={40} step={1} onValueChange={([v]) => setRate(v)} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <Label>Loan term</Label>
              <span className="font-semibold">{term} months</span>
            </div>
            <Slider defaultValue={[term]} min={12} max={72} step={6} onValueChange={([v]) => setTerm(v)} />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white">
          <p className="text-sm text-brand-100">Monthly payment</p>
          <p className="font-display text-4xl font-bold">{formatCurrency(result.monthlyPayment)}</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-xs text-brand-100">Loan amount</p>
              <p className="text-sm font-semibold">{formatCurrency(result.loanAmount)}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-xs text-brand-100">Total interest</p>
              <p className="text-sm font-semibold">{formatCurrency(result.totalInterest)}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-xs text-brand-100">Total payable</p>
              <p className="text-sm font-semibold">{formatCurrency(result.totalPayable)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h3 className="flex items-center gap-2 font-semibold">
            <TrendingUp className="h-4 w-4 text-brand-500" /> Payment schedule (first 12 months)
          </h3>
          <div className="mt-4 max-h-72 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 font-medium">#</th>
                  <th className="py-2 font-medium">Principal</th>
                  <th className="py-2 font-medium">Interest</th>
                  <th className="py-2 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {result.schedule.slice(0, 12).map((row) => (
                  <tr key={row.month} className="border-b last:border-0">
                    <td className="py-2 text-muted-foreground">{row.month}</td>
                    <td className="py-2">{formatCurrency(row.principal)}</td>
                    <td className="py-2">{formatCurrency(row.interest)}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Percent className="h-3.5 w-3.5" /> Indicative only — actual rates depend on the lender
            and your credit profile.
          </p>
        </div>
      </div>
    </div>
  );
}
