"use client";

import { useMemo, useState } from "react";
import { Anchor, Clock, Ship } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  estimateShipping,
  SHIPPING_LANES,
  SHIPPING_METHOD_LABELS,
  type ShippingInput,
} from "@/lib/shipping-calculator";
import { formatCurrency } from "@/lib/utils";

const VEHICLE_CLASSES = [
  { value: "SEDAN", label: "Sedan / Saloon" },
  { value: "SUV", label: "SUV / Crossover" },
  { value: "PICKUP", label: "Pickup / Truck" },
  { value: "BUS", label: "Bus / Van" },
];

export function ShippingCalculator({ exchangeRate = 15.5 }: { exchangeRate?: number }) {
  const [input, setInput] = useState<ShippingInput>({
    originCountry: "United States",
    method: "RORO",
    vehicleClass: "SEDAN",
    exchangeRate,
  });

  const result = useMemo(() => estimateShipping(input), [input]);

  function set<K extends keyof ShippingInput>(key: K, value: ShippingInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Ship className="h-5 w-5 text-brand-500" /> Shipping details
        </h2>
        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label>Shipping from</Label>
            <Select value={input.originCountry} onValueChange={(v) => set("originCountry", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHIPPING_LANES.map((lane) => (
                  <SelectItem key={lane.originCountry} value={lane.originCountry}>
                    {lane.originCountry} — {lane.originPort}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Destination port</Label>
            <Select value="Tema" disabled>
              <SelectTrigger>
                <SelectValue placeholder="Tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tema">Tema Port, Ghana</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Shipping method</Label>
            <Select
              value={input.method}
              onValueChange={(v) => set("method", v as ShippingInput["method"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SHIPPING_METHOD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Vehicle class</Label>
            <Select
              value={input.vehicleClass}
              onValueChange={(v) => set("vehicleClass", v as ShippingInput["vehicleClass"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_CLASSES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">RoRo</strong> is cheaper and faster for running
          vehicles. <strong className="text-foreground">Container</strong> shipping adds protection
          and lets you ship parts inside the vehicle.
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="text-lg font-semibold">Estimated shipping</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-gradient-to-br from-brand-50 to-background p-5 dark:from-brand-900/20">
            <Anchor className="h-5 w-5 text-brand-500" />
            <p className="mt-2 text-xs text-muted-foreground">Shipping cost (USD)</p>
            <p className="font-display text-2xl font-bold text-brand-700 dark:text-brand-300">
              ${result.costUsd.toLocaleString()}
            </p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              ≈ {formatCurrency(result.costGhs)}
            </p>
          </div>
          <div className="rounded-xl border p-5">
            <Clock className="h-5 w-5 text-brand-500" />
            <p className="mt-2 text-xs text-muted-foreground">Estimated transit time</p>
            <p className="font-display text-2xl font-bold">
              {result.transitDaysMin}–{result.transitDaysMax}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">days to Tema</p>
          </div>
        </div>

        <dl className="mt-6 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Origin port</dt>
            <dd className="font-medium">{result.lane?.originPort}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Method</dt>
            <dd className="font-medium">{SHIPPING_METHOD_LABELS[result.method]}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Vehicle class</dt>
            <dd className="font-medium capitalize">{result.vehicleClass.toLowerCase()}</dd>
          </div>
        </dl>

        <a
          href="/app/calculators/import-duty"
          className="mt-6 block rounded-xl bg-brand-600 p-4 text-center text-sm font-semibold text-white hover:bg-brand-700"
        >
          Add duties → see total import estimate
        </a>
      </div>
    </div>
  );
}
