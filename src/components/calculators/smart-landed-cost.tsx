"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, FileSearch, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
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
import { formatCurrency } from "@/lib/utils";
import type { CohortQuote, HdvQuote } from "@/lib/landed-cost";

interface CatalogEntry {
  code: string;
  name: string;
}

const OTHER = "__other__";
const CURRENT_YEAR = new Date().getFullYear();

/** The HDV-anchored estimate, plus the extras the API attaches to it. */
type HdvQuoteResponse = HdvQuote & {
  availableTrims?: string[];
  hsCode?: string | null;
  fxAsOf?: string | null;
};
type AnyQuote = CohortQuote | HdvQuoteResponse;

/** HDV-anchored quotes carry a calibration; cohort quotes don't. */
function isHdvQuote(q: AnyQuote): q is HdvQuoteResponse {
  return q.tier === "EXACT" || q.tier === "MODEL";
}

type QuoteState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "basic" } // no data at all — fall back to the classic calculator
  | { status: "quote"; quote: AnyQuote };

/**
 * Data-backed duty & taxes estimate: pick the car the ICUMS way (coded Make →
 * Model → Year) and get what similar cars ACTUALLY paid, repriced at the
 * latest observed customs FX rate — receipts included. Falls back to the
 * classic formula calculator (rendered below on the page) when no verified
 * cohort exists yet.
 */
export function SmartLandedCost() {
  const [makes, setMakes] = useState<CatalogEntry[]>([]);
  const [models, setModels] = useState<CatalogEntry[]>([]);
  const [makeCode, setMakeCode] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [makeText, setMakeText] = useState("");
  const [modelText, setModelText] = useState("");
  const [year, setYear] = useState(String(CURRENT_YEAR - 4));
  const [trim, setTrim] = useState("");
  const [state, setState] = useState<QuoteState>({ status: "idle" });

  // "Complete the picture" inputs for the grand total.
  const [priceUsd, setPriceUsd] = useState("");
  const [shippingGhs, setShippingGhs] = useState("18000");

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

  const makeIsFreeText = makes.length === 0 || makeCode === OTHER;
  const modelIsFreeText =
    makeIsFreeText || (models.length === 0 && makeCode !== "") || modelCode === OTHER;

  const makeName = makeIsFreeText
    ? makeText
    : (makes.find((m) => m.code === makeCode)?.name ?? "");
  const modelName = modelIsFreeText
    ? modelText
    : (models.find((m) => m.code === modelCode)?.name ?? "");

  async function getEstimate(e?: React.FormEvent, trimOverride?: string) {
    e?.preventDefault();
    const effectiveTrim = trimOverride !== undefined ? trimOverride : trim;
    if (!makeName.trim() || !modelName.trim()) {
      toast.error("Select or enter the make and model");
      return;
    }
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/calculators/landed-cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          make: makeName,
          model: modelName,
          year,
          icumsMakeCode: makeCode && makeCode !== OTHER ? makeCode : undefined,
          icumsModelCode: modelCode && modelCode !== OTHER ? modelCode : undefined,
          trim: effectiveTrim || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Estimate failed");
        setState({ status: "idle" });
        return;
      }
      setState(data.tier === "BASIC" ? { status: "basic" } : { status: "quote", quote: data });
    } catch {
      toast.error("Something went wrong. Please try again.");
      setState({ status: "idle" });
    }
  }

  const quote = state.status === "quote" ? state.quote : null;
  const price = Number(priceUsd) || 0;
  const shipping = Number(shippingGhs) || 0;
  const grandTotal =
    quote && price > 0 ? price * quote.fxRate + quote.taxGhs.point + shipping : null;

  return (
    <section className="rounded-2xl border-2 border-brand-200 bg-card p-6 shadow-soft dark:border-brand-900">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Sparkles className="h-5 w-5 text-brand-500" /> Data-backed estimate
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          Beta
        </span>
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Based on what similar cars <em>actually paid</em> at the port — from verified ICUMS
        outcomes, converted at the latest customs exchange rate.
      </p>

      <form onSubmit={getEstimate} className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="slc-make">Make</Label>
          {makes.length > 0 ? (
            <Select
              value={makeCode}
              onValueChange={(v) => {
                setMakeCode(v);
                setModelCode("");
              }}
            >
              <SelectTrigger id="slc-make">
                <SelectValue placeholder="Select make" />
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
              id={makes.length > 0 ? "slc-make-other" : "slc-make"}
              value={makeText}
              onChange={(e) => setMakeText(e.target.value)}
              placeholder="e.g. Toyota"
              aria-label={makes.length > 0 ? "Make (free text)" : undefined}
            />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="slc-model">Model</Label>
          {!makeIsFreeText && (
            <Select
              value={modelCode}
              onValueChange={setModelCode}
              disabled={!makeCode || models.length === 0}
            >
              <SelectTrigger id="slc-model">
                <SelectValue
                  placeholder={
                    !makeCode
                      ? "Select make first"
                      : models.length === 0
                        ? "No models listed"
                        : "Select model"
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
              id={!makeIsFreeText ? "slc-model-other" : "slc-model"}
              value={modelText}
              onChange={(e) => setModelText(e.target.value)}
              placeholder="e.g. Camry"
              aria-label={!makeIsFreeText ? "Model (free text)" : undefined}
            />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="slc-year">Year of manufacture</Label>
          <Input
            id="slc-year"
            type="number"
            inputMode="numeric"
            min={1980}
            max={CURRENT_YEAR + 1}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
        <div className="sm:col-span-3">
          <Button type="submit" variant="gradient" disabled={state.status === "loading"}>
            {state.status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
            Get data-backed estimate
          </Button>
        </div>
      </form>

      {state.status === "basic" && (
        <div className="mt-5 flex items-start gap-2 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
          <FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
          <span>
            No verified customs records for this exact car yet — new records are added weekly.
            Meanwhile, use the classic calculator below for a formula-based estimate.
          </span>
        </div>
      )}

      {quote && (
        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                quote.tier === "EXACT" || quote.tier === "HIGH"
                  ? "inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success"
                  : "inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning"
              }
            >
              <BadgeCheck className="h-3.5 w-3.5" />
              {quote.tier === "EXACT"
                ? "Highest confidence"
                : quote.tier === "HIGH"
                  ? "High confidence"
                  : quote.tier === "MODEL"
                    ? "Good confidence"
                    : "Medium confidence"}
            </span>
            <span className="text-xs text-muted-foreground">
              {isHdvQuote(quote) ? (
                <>
                  {quote.tier === "EXACT"
                    ? "Anchored on GRA's own valuation for this exact trim"
                    : "Anchored on GRA's valuation for this model-year (trim not specified)"}
                  , calibrated on {quote.calibration.sampleSize} clearance
                  {quote.calibration.sampleSize === 1 ? "" : "s"} · customs rate{" "}
                  {quote.fxRate.toFixed(4)} GHS/USD
                  {quote.fxAsOf ? ` (as of ${quote.fxAsOf})` : ""}
                </>
              ) : (
                <>
                  Based on {quote.observationCount} similar car
                  {quote.observationCount === 1 ? "" : "s"} cleared recently
                  {quote.tier === "MEDIUM" ? " (includes nearby years)" : ""} · customs rate{" "}
                  {quote.fxRate.toFixed(4)} GHS/USD
                  {quote.fxAsOf ? ` (as of ${quote.fxAsOf})` : ""}
                </>
              )}
            </span>
          </div>

          {/* Trim picker — a trim-specific HDV tightens the estimate a lot. */}
          {isHdvQuote(quote) && (quote.availableTrims?.length ?? 0) > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border p-3">
              <span className="text-xs font-medium text-muted-foreground">
                Know the trim? Pick it for an exact valuation:
              </span>
              {quote.availableTrims!.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTrim(t);
                    void getEstimate(undefined, t);
                  }}
                  className={
                    trim === t
                      ? "rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white"
                      : "rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  }
                >
                  {t}
                </button>
              ))}
              {trim && (
                <button
                  type="button"
                  onClick={() => {
                    setTrim("");
                    void getEstimate(undefined, "");
                  }}
                  className="text-xs text-muted-foreground underline"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white">
            <p className="text-sm text-brand-100">Estimated duty & taxes</p>
            <p className="font-display text-3xl font-bold">
              {formatCurrency(quote.taxGhs.point)}
            </p>
            <p className="mt-1 text-xs text-brand-200">
              Similar cars paid between {formatCurrency(quote.taxGhs.low)} and{" "}
              {formatCurrency(quote.taxGhs.high)} (at today&apos;s rate)
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slc-price">Car price abroad (USD)</Label>
              <Input
                id="slc-price"
                type="number"
                inputMode="decimal"
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
                placeholder="What you'll pay for the car"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slc-ship">Shipping & handling (GHS)</Label>
              <Input
                id="slc-ship"
                type="number"
                inputMode="decimal"
                value={shippingGhs}
                onChange={(e) => setShippingGhs(e.target.value)}
              />
            </div>
          </div>
          {grandTotal != null && (
            <div className="flex items-baseline justify-between rounded-xl border p-4">
              <span className="text-sm font-semibold">Estimated total landed cost</span>
              <span className="font-display text-2xl font-bold text-brand-700 dark:text-brand-400">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          )}

          {/* The arithmetic, in the open — so anyone can check it on ICUMS. */}
          {isHdvQuote(quote) && (
            <details className="rounded-xl border p-4">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                How we worked this out
              </summary>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">
                    GRA valuation (HDV){quote.tier === "MODEL" ? ", model-year median" : ""}
                  </dt>
                  <dd className="font-medium">
                    {formatCurrency(quote.hdv, quote.hdvCurrency)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">× customs exchange rate</dt>
                  <dd className="font-medium tabular-nums">{quote.fxRate.toFixed(4)}</dd>
                </div>
                {quote.calibration.cifFactor != null && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">
                      × CIF factor (depreciation + freight, {quote.ageYears}y old)
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {quote.calibration.cifFactor.toFixed(3)}
                    </dd>
                  </div>
                )}
                {quote.calibration.effectiveRate != null && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">
                      × tax rate on CIF{quote.hsCode ? ` (HS ${quote.hsCode})` : ""}
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {(quote.calibration.effectiveRate * 100).toFixed(2)}%
                    </dd>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold">Estimated duty &amp; taxes</dt>
                  <dd className="font-semibold">{formatCurrency(quote.taxGhs.point)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Calibrated on {quote.calibration.sampleSize} verified clearance
                {quote.calibration.sampleSize === 1 ? "" : "s"}
                {quote.calibration.basis === "AGE"
                  ? " of the same age"
                  : quote.calibration.basis === "HS_CODE"
                    ? " in the same tax class"
                    : " across our records"}
                . You can check the valuation yourself on the GRA ICUMS portal.
              </p>
            </details>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Similar cars recently cleared
            </p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Trim</th>
                    <th className="py-2 pr-3 font-medium">Year</th>
                    <th className="py-2 pr-3 font-medium">HDV (USD)</th>
                    <th className="py-2 pr-3 font-medium">Total tax paid</th>
                    <th className="py-2 pr-3 font-medium">Assessed</th>
                    <th className="py-2 font-medium">Port</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.receipts.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-3">{r.trimLevel ?? "—"}</td>
                      <td className="py-2 pr-3">{r.yearOfManufacture}</td>
                      <td className="py-2 pr-3">
                        {r.hdv != null ? formatCurrency(r.hdv, "USD") : "—"}
                      </td>
                      <td className="py-2 pr-3 font-medium">{formatCurrency(r.totalTax)}</td>
                      <td className="py-2 pr-3">{r.assessedAt ?? "—"}</td>
                      <td className="py-2">{r.port}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />
          <p className="text-[11px] text-muted-foreground">
            Estimate from real, anonymised ICUMS outcomes for similar vehicles. Your exact
            assessment depends on trim, condition and the customs rate on the day — GRA&apos;s
            figure is final.
          </p>
        </div>
      )}
    </section>
  );
}
