"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { FOB_CURRENCIES, SOURCE_MARKETS } from "@/lib/import-stock";
import { BODY_TYPES, FUEL_TYPES, TRANSMISSIONS } from "@/lib/constants";

/**
 * Publish a car buyers can reserve.
 *
 * Saves as a draft. Publishing is deliberately a second step: a listing with no
 * exchange rate cannot show a landed cost, and a half-priced car on a browse
 * page is worse than no car at all.
 */
export function StockForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    make: "",
    model: "",
    trim: "",
    year: String(new Date().getFullYear() - 5),
    mileage: "",
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    bodyType: "SUV",
    color: "",
    countryOfOrigin: "Japan",
    portOfLoading: "",
    auctionGrade: "",
    chassisNumber: "",
    fobAmount: "",
    fobCurrency: "JPY",
    fxRateToGhs: "",
    freightGhs: "",
    serviceFeeGhs: "",
    quantity: "1",
    etaDays: "",
    description: "",
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      // Empty optional numbers are dropped rather than sent as "" — the schema
      // coerces, and coercing "" gives 0, which would publish a free car.
      const payload: Record<string, unknown> = { ...form };
      for (const key of [
        "mileage",
        "fxRateToGhs",
        "freightGhs",
        "serviceFeeGhs",
        "etaDays",
      ] as const) {
        if (!form[key]) delete payload[key];
      }

      const res = await fetch("/api/import-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not save the listing");
        return;
      }
      toast.success("Saved as a draft. Publish it when the pricing is set.");
      router.push("/dashboard/importer/stock");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <Section title="The car" hint="What a buyer is choosing between.">
        <Field label="Listing title" className="sm:col-span-2">
          <Input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="2019 Toyota Harrier Premium — Grade 4.5"
          />
        </Field>
        <Field label="Make">
          <Input required value={form.make} onChange={(e) => set("make", e.target.value)} />
        </Field>
        <Field label="Model">
          <Input required value={form.model} onChange={(e) => set("model", e.target.value)} />
        </Field>
        <Field label="Trim" hint="Sharpens our duty estimate when we hold its reference value.">
          <Input value={form.trim} onChange={(e) => set("trim", e.target.value)} />
        </Field>
        <Field label="Year">
          <Input
            required
            type="number"
            value={form.year}
            onChange={(e) => set("year", e.target.value)}
          />
        </Field>
        <Field label="Mileage (km)">
          <Input type="number" value={form.mileage} onChange={(e) => set("mileage", e.target.value)} />
        </Field>
        <Field label="Colour">
          <Input value={form.color} onChange={(e) => set("color", e.target.value)} />
        </Field>
        <Field label="Fuel">
          <Picker value={form.fuelType} onChange={(v) => set("fuelType", v)} options={FUEL_TYPES} />
        </Field>
        <Field label="Transmission">
          <Picker
            value={form.transmission}
            onChange={(v) => set("transmission", v)}
            options={TRANSMISSIONS}
          />
        </Field>
        <Field label="Body type">
          <Picker value={form.bodyType} onChange={(v) => set("bodyType", v)} options={BODY_TYPES} />
        </Field>
      </Section>

      <Section title="Where it is" hint="Buyers judge a Japanese auction grade differently from a UK trade car.">
        <Field label="Source market">
          <Select
            value={form.countryOfOrigin}
            onValueChange={(v) => set("countryOfOrigin", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_MARKETS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Port of loading">
          <Input
            value={form.portOfLoading}
            onChange={(e) => set("portOfLoading", e.target.value)}
            placeholder="Nagoya"
          />
        </Field>
        <Field label="Auction grade">
          <Input
            value={form.auctionGrade}
            onChange={(e) => set("auctionGrade", e.target.value)}
            placeholder="4.5"
          />
        </Field>
        <Field label="Chassis number">
          <Input
            value={form.chassisNumber}
            onChange={(e) => set("chassisNumber", e.target.value)}
          />
        </Field>
      </Section>

      <Section
        title="Price"
        hint="You quote the FOB, shipping and your fee. We estimate duty from real customs assessments and show it separately."
      >
        <Field label="FOB amount">
          <Input
            required
            type="number"
            step="any"
            value={form.fobAmount}
            onChange={(e) => set("fobAmount", e.target.value)}
          />
        </Field>
        <Field label="FOB currency">
          <Select value={form.fobCurrency} onValueChange={(v) => set("fobCurrency", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FOB_CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field
          label={`Cedis per 1 ${form.fobCurrency}`}
          hint="Without this we can't show a cedi price at all — we won't guess a rate."
        >
          <Input
            type="number"
            step="any"
            value={form.fxRateToGhs}
            onChange={(e) => set("fxRateToGhs", e.target.value)}
            placeholder="0.085"
          />
        </Field>
        <Field label="Shipping to Tema (GH₵)">
          <Input
            type="number"
            step="any"
            value={form.freightGhs}
            onChange={(e) => set("freightGhs", e.target.value)}
          />
        </Field>
        <Field label="Your fee (GH₵)" hint="Shown as its own line, so buyers can compare importers on it.">
          <Input
            type="number"
            step="any"
            value={form.serviceFeeGhs}
            onChange={(e) => set("serviceFeeGhs", e.target.value)}
          />
        </Field>
        <Field label="Units available" hint="Identical cars from the same run. Each is reserved separately.">
          <Input
            required
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => set("quantity", e.target.value)}
          />
        </Field>
        <Field label="Typical ETA (days)">
          <Input type="number" value={form.etaDays} onChange={(e) => set("etaDays", e.target.value)} />
        </Field>
      </Section>

      <Section title="Notes" hint="Anything the auction sheet does not say.">
        <div className="sm:col-span-2">
          <Textarea
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
      </Section>

      <div className="flex justify-end gap-3 border-t pt-6">
        <Button type="submit" variant="gradient" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Save as draft
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Picker({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
