"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_RATES, type DutyRateSet } from "@/lib/duty-calculator";

const FIELDS: { key: keyof DutyRateSet; label: string }[] = [
  { key: "importDutyRate", label: "Import Duty (%)" },
  { key: "vatRate", label: "VAT (%)" },
  { key: "nhilRate", label: "NHIL (%)" },
  { key: "getfundRate", label: "GETFund Levy (%)" },
  { key: "covidLevyRate", label: "COVID-19 Health Levy (%)" },
  { key: "ecowasLevyRate", label: "ECOWAS Levy (%)" },
  { key: "examinationFee", label: "Examination Fee (%)" },
  { key: "networkCharge", label: "Network / Processing (%)" },
];

export function DutyRatesEditor() {
  const [rates, setRates] = useState<DutyRateSet>({ ...DEFAULT_RATES });
  const [category, setCategory] = useState("Saloon / SUV (standard)");
  const [loading, setLoading] = useState(false);

  function update(key: keyof DutyRateSet, value: number) {
    setRates((r) => ({ ...r, [key]: value }));
  }

  async function save() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/duty-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, label: category, ...rates }),
      });
      if (!res.ok) throw new Error();
      toast.success("Duty rates saved. Live calculators updated.");
    } catch {
      toast.error("Could not save rates");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft">
      <div className="space-y-2">
        <Label>Vehicle category</Label>
        <Input value={category} onChange={(e) => setCategory(e.target.value)} className="max-w-md" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label className="text-xs">{field.label}</Label>
            <Input
              type="number"
              step="0.1"
              value={rates[field.key]}
              onChange={(e) => update(field.key, Number(e.target.value))}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save} variant="gradient" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save & publish rates
        </Button>
        <Button variant="outline" onClick={() => setRates({ ...DEFAULT_RATES })}>
          Reset to defaults
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Changes take effect immediately across the import duty calculator and all vehicle pages.
      </p>
    </div>
  );
}
