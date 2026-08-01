"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Info, Receipt, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateDuty, type DutyInput } from "@/lib/duty-calculator";
import { FUEL_TYPES, BODY_TYPES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();

export function DutyCalculator({ exchangeRate = 15.5 }: { exchangeRate?: number }) {
  const [input, setInput] = useState<DutyInput>({
    cifValue: 14000,
    currency: "USD",
    exchangeRate,
    manufactureYear: CURRENT_YEAR - 4,
    engineSizeCc: 2500,
    fuelType: "PETROL",
    bodyType: "SEDAN",
    shippingCost: 18000,
  });

  const result = useMemo(() => calculateDuty(input), [input]);

  function set<K extends keyof DutyInput>(key: K, value: DutyInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  const taxItems = result.lineItems.filter(
    (li) =>
      !["cif", "shipping", "port", "clearing", "delivery", "processing"].includes(li.key),
  );
  const logisticsItems = result.lineItems.filter((li) =>
    ["shipping", "port", "clearing", "delivery", "processing"].includes(li.key),
  );

  return (
    // [&>*]:min-w-0 — grid items default to min-width:auto, so a wide input
    // row inside a card would size the track and push the page sideways on
    // small screens.
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] [&>*]:min-w-0">
      {/* Inputs */}
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Calculator className="h-5 w-5 text-brand-500" /> Vehicle details
        </h2>

        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CIF value</Label>
              <Input
                type="number"
                value={input.cifValue}
                onChange={(e) => set("cifValue", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={input.currency}
                onValueChange={(v) => set("currency", v as DutyInput["currency"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GHS">GHS (₵)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {input.currency !== "GHS" && (
            <div className="space-y-2">
              <Label>Exchange rate (GHS per {input.currency})</Label>
              <Input
                type="number"
                step="0.01"
                value={input.exchangeRate}
                onChange={(e) => set("exchangeRate", Number(e.target.value))}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Manufacture year</Label>
              <Input
                type="number"
                min={1980}
                max={CURRENT_YEAR + 1}
                value={input.manufactureYear}
                onChange={(e) => set("manufactureYear", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Engine size (cc)</Label>
              <Input
                type="number"
                value={input.engineSizeCc}
                onChange={(e) => set("engineSizeCc", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fuel type</Label>
              <Select
                value={input.fuelType}
                onValueChange={(v) => set("fuelType", v as DutyInput["fuelType"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Body type</Label>
              <Select
                value={input.bodyType}
                onValueChange={(v) => set("bodyType", v as DutyInput["bodyType"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BODY_TYPES.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estimated shipping cost (GHS)</Label>
            <Input
              type="number"
              value={input.shippingCost}
              onChange={(e) => set("shippingCost", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
          <span>
            CIF = Cost + Insurance + Freight. The duty rate is auto-selected from the vehicle's
            body type, engine size and fuel. Vehicles over 10 years attract an over-age penalty.
          </span>
        </div>
      </div>

      {/* Results */}
      <motion.div
        key={result.totalLandedCost}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border bg-card p-6 shadow-soft"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Receipt className="h-5 w-5 text-brand-500" /> Cost breakdown
          </h2>
          {result.overAge && (
            <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning">
              Over-aged ({result.vehicleAgeYears}y)
            </span>
          )}
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">CIF value (GHS)</span>
            <span className="font-semibold">{formatCurrency(result.cifGhs)}</span>
          </div>

          <Separator />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Duties & taxes
          </p>
          {taxItems.map((li) => (
            <div key={li.key} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{li.label}</span>
              <span className="font-medium">{formatCurrency(li.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-semibold">
            <span>Total duties & taxes</span>
            <span>{formatCurrency(result.taxesSubtotal)}</span>
          </div>

          <Separator />
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Ship className="h-3.5 w-3.5" /> Logistics & handling
          </p>
          {logisticsItems.map((li) => (
            <div key={li.key} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{li.label}</span>
              <span className="font-medium">{formatCurrency(li.amount)}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white">
          <p className="text-sm text-brand-100">Total landed cost</p>
          <p className="font-display text-3xl font-bold">
            {formatCurrency(result.totalLandedCost)}
          </p>
          <p className="mt-1 text-xs text-brand-200">
            Applied import duty rate: {result.ratesUsed.importDutyRate}%
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <Button asChild variant="gradient" className="flex-1">
            <a href="/import">Start this import</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/app/calculators/shipping">Shipping calculator</a>
          </Button>
        </div>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Estimate only. Final assessment is done by GRA Customs via ICUMS.
        </p>
      </motion.div>
    </div>
  );
}
