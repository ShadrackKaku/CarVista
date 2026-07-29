"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/image-uploader";

interface CatalogEntry {
  code: string;
  name: string;
}

/** Sentinel for "my make/model isn't in the list" — switches to free text. */
const OTHER = "__other__";

/** Public "submit your ICUMS duty bill" form. Field names mirror the ICUMS
 *  Tax Result screen so anyone holding a tax bill can transcribe it 1:1.
 *  Make/Model use ICUMS's own coded catalogue (cascading: picking a make
 *  loads that make's models), so submissions join cleanly to the taxonomy
 *  GRA assesses against. */
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
    exchangeRate: "",
    assessedAt: "",
    port: "Tema",
    notes: "",
  });

  // ICUMS coded catalogue for the cascading pickers.
  const [makes, setMakes] = useState<CatalogEntry[]>([]);
  const [models, setModels] = useState<CatalogEntry[]>([]);
  const [makeCode, setMakeCode] = useState("");
  const [modelCode, setModelCode] = useState("");

  useEffect(() => {
    fetch("/api/icums/makes")
      .then((r) => r.json())
      .then((d) => setMakes(Array.isArray(d.makes) ? d.makes : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!makeCode || makeCode === OTHER) {
      setModels([]);
      return;
    }
    fetch(`/api/icums/models?make=${makeCode}`)
      .then((r) => r.json())
      .then((d) => setModels(Array.isArray(d.models) ? d.models : []))
      .catch(() => setModels([]));
  }, [makeCode]);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function pickMake(code: string) {
    setMakeCode(code);
    setModelCode("");
    update("modelType", "");
    update("make", code === OTHER ? "" : (makes.find((m) => m.code === code)?.name ?? ""));
  }

  function pickModel(code: string) {
    setModelCode(code);
    update("modelType", code === OTHER ? "" : (models.find((m) => m.code === code)?.name ?? ""));
  }

  const makeIsFreeText = makes.length === 0 || makeCode === OTHER;
  const modelIsFreeText = makeIsFreeText || (models.length === 0 && makeCode !== "") || modelCode === OTHER;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.make.trim() || !form.modelType.trim()) {
      toast.error("Select or enter the vehicle's make and model");
      return;
    }
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
          exchangeRate: form.exchangeRate || undefined,
          assessedAt: form.assessedAt || undefined,
          fuelType: form.fuelType || undefined,
          notes: form.notes || undefined,
          documentUrls: documentUrls.length ? documentUrls : undefined,
          // ICUMS taxonomy codes when picked from the catalogue.
          icumsMakeCode: makeCode && makeCode !== OTHER ? makeCode : undefined,
          icumsModelCode: modelCode && modelCode !== OTHER ? modelCode : undefined,
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
          {makes.length > 0 ? (
            <Select value={makeCode} onValueChange={pickMake}>
              <SelectTrigger id="da-make" className="mt-1.5">
                <SelectValue placeholder="Select the make" />
              </SelectTrigger>
              <SelectContent>
                {makes.map((m) => (
                  <SelectItem key={m.code} value={m.code}>
                    {m.name}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER}>Other / not listed…</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
          {makeIsFreeText && (
            <Input
              id={makes.length > 0 ? "da-make-other" : "da-make"}
              required
              value={form.make}
              onChange={(e) => update("make", e.target.value)}
              placeholder="e.g. Toyota"
              aria-label={makes.length > 0 ? "Make (free text)" : undefined}
              className="mt-1.5"
            />
          )}
        </div>
        <div>
          <Label htmlFor="da-model">Model *</Label>
          {!makeIsFreeText && (
            <Select
              value={modelCode}
              onValueChange={pickModel}
              disabled={!makeCode || models.length === 0}
            >
              <SelectTrigger id="da-model" className="mt-1.5">
                <SelectValue
                  placeholder={
                    !makeCode
                      ? "Select the make first"
                      : models.length === 0
                        ? "No models listed — type below"
                        : "Select the model"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.code} value={m.code}>
                    {m.name}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER}>Other / not listed…</SelectItem>
              </SelectContent>
            </Select>
          )}
          {modelIsFreeText && (
            <Input
              id={!makeIsFreeText ? "da-model-other" : "da-model"}
              required
              value={form.modelType}
              onChange={(e) => update("modelType", e.target.value)}
              placeholder="e.g. Corolla"
              aria-label={!makeIsFreeText ? "Model (free text)" : undefined}
              className="mt-1.5"
            />
          )}
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
          <Label htmlFor="da-fx">Exchange rate (GHS/USD, if shown)</Label>
          <Input
            id="da-fx"
            type="number"
            inputMode="decimal"
            step="0.0001"
            value={form.exchangeRate}
            onChange={(e) => update("exchangeRate", e.target.value)}
            placeholder="e.g. 11.2981"
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
