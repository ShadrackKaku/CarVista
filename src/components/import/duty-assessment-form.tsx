"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/image-uploader";

/** Public "submit your ICUMS duty bill" form. Field names mirror the ICUMS
 *  Tax Result screen so anyone holding a tax bill can transcribe it 1:1. */
export function DutyAssessmentForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [documentUrls, setDocumentUrls] = useState<string[]>([]);
  const [form, setForm] = useState({
    chassisNumber: "",
    make: "",
    modelType: "",
    yearOfManufacture: "",
    totalTax: "",
    engineSizeCc: "",
    fuelType: "",
    hdv: "",
    cifNcy: "",
    assessedAt: "",
    port: "Tema",
    notes: "",
  });

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/duty-assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // Optional numerics: send only when filled so zod doesn't coerce "".
          engineSizeCc: form.engineSizeCc || undefined,
          hdv: form.hdv || undefined,
          cifNcy: form.cifNcy || undefined,
          assessedAt: form.assessedAt || undefined,
          fuelType: form.fuelType || undefined,
          notes: form.notes || undefined,
          documentUrls: documentUrls.length ? documentUrls : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to submit");
        return;
      }
      setSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center shadow-soft">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <h3 className="mt-4 font-display text-xl font-bold">Thank you — received!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Our team will verify the details. Every verified bill makes duty estimates more accurate
          for the next importer.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border bg-card p-6 shadow-soft">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="da-chassis">Chassis / VIN number *</Label>
          <Input
            id="da-chassis"
            required
            value={form.chassisNumber}
            onChange={(e) => update("chassisNumber", e.target.value)}
            placeholder="e.g. JTDBR32E720123456"
            className="mt-1.5 font-mono uppercase"
          />
        </div>
        <div>
          <Label htmlFor="da-make">Make *</Label>
          <Input
            id="da-make"
            required
            value={form.make}
            onChange={(e) => update("make", e.target.value)}
            placeholder="e.g. Toyota"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="da-model">Model *</Label>
          <Input
            id="da-model"
            required
            value={form.modelType}
            onChange={(e) => update("modelType", e.target.value)}
            placeholder="e.g. Corolla"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="da-year">Year of manufacture *</Label>
          <Input
            id="da-year"
            required
            type="number"
            inputMode="numeric"
            min={1980}
            value={form.yearOfManufacture}
            onChange={(e) => update("yearOfManufacture", e.target.value)}
            placeholder="e.g. 2016"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="da-total">Total tax paid (GHS) *</Label>
          <Input
            id="da-total"
            required
            type="number"
            inputMode="decimal"
            min={1}
            step="0.01"
            value={form.totalTax}
            onChange={(e) => update("totalTax", e.target.value)}
            placeholder="From the tax bill's Total Tax line"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="da-engine">Engine size (cc)</Label>
          <Input
            id="da-engine"
            type="number"
            inputMode="numeric"
            value={form.engineSizeCc}
            onChange={(e) => update("engineSizeCc", e.target.value)}
            placeholder="e.g. 1800"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="da-fuel">Fuel type</Label>
          <Input
            id="da-fuel"
            value={form.fuelType}
            onChange={(e) => update("fuelType", e.target.value)}
            placeholder="e.g. Petrol"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="da-hdv">HDV (if shown, USD)</Label>
          <Input
            id="da-hdv"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={form.hdv}
            onChange={(e) => update("hdv", e.target.value)}
            placeholder="Home Delivery Value"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="da-cif">CIF (if shown, GHS)</Label>
          <Input
            id="da-cif"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={form.cifNcy}
            onChange={(e) => update("cifNcy", e.target.value)}
            placeholder="CIF NCY on the bill"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="da-date">Assessment date</Label>
          <Input
            id="da-date"
            type="date"
            value={form.assessedAt}
            onChange={(e) => update("assessedAt", e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="da-port">Port</Label>
          <Input
            id="da-port"
            value={form.port}
            onChange={(e) => update("port", e.target.value)}
            placeholder="Tema"
            className="mt-1.5"
          />
        </div>
      </div>

      <ImageUploader
        value={documentUrls}
        onChange={setDocumentUrls}
        max={6}
        label="Tax bill photos (recommended)"
        hint="A photo of the ICUMS tax bill lets us verify faster. Up to 6 images."
      />

      <div>
        <Label htmlFor="da-notes">Notes</Label>
        <Textarea
          id="da-notes"
          rows={3}
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Anything unusual about the clearance — penalties, re-assessment, agent used…"
          className="mt-1.5"
        />
      </div>

      <Button type="submit" variant="gradient" disabled={loading} className="w-full sm:w-auto">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />} Submit duty bill
      </Button>
    </form>
  );
}
