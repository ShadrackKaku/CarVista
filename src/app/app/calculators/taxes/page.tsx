import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Check, Info } from "lucide-react";
import {
  DEFAULT_RATES,
  DEFAULT_FLAT_CHARGES,
  LEVY_BASE_LABELS,
  calculateDuty,
  resolveOverAgePenalty,
  type LevyBase,
} from "@/lib/duty-calculator";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Vehicle Taxes & Duties in Ghana",
  description:
    "Every duty, levy and fee charged on a vehicle imported into Ghana — the rate, what it is charged on, and the over-age penalty bands. Updated for the 2026 rules.",
};

const ghs = (n: number) =>
  new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2,
  }).format(n);

const pct = (n: number) => `${n}%`;

interface LevyRow {
  name: string;
  rate: string;
  base: LevyBase;
  what: string;
}

const LEVIES: LevyRow[] = [
  {
    name: "Import Duty",
    rate: "5% · 10% · 20%",
    base: "CIF",
    what: "The tariff itself. Which of the three bands you land in depends on the vehicle category, not its engine size.",
  },
  {
    name: "VAT",
    rate: pct(DEFAULT_RATES.vatRate),
    base: "CIF_PLUS_DUTY",
    what: "Value Added Tax. Charged on the duty-inclusive value, so the duty is itself taxed.",
  },
  {
    name: "NHIL",
    rate: pct(DEFAULT_RATES.nhilRate),
    base: "CIF_PLUS_DUTY",
    what: "National Health Insurance Levy — funds the NHIS.",
  },
  {
    name: "GETFund Levy",
    rate: pct(DEFAULT_RATES.getfundRate),
    base: "CIF_PLUS_DUTY",
    what: "Ghana Education Trust Fund.",
  },
  {
    name: "ECOWAS Levy",
    rate: pct(DEFAULT_RATES.ecowasLevyRate),
    base: "CIF",
    what: "Community levy on goods entering the ECOWAS bloc from outside it.",
  },
  {
    name: "African Union Levy",
    rate: pct(DEFAULT_RATES.auLevyRate),
    base: "CIF",
    what: "Ghana's contribution to the African Union, collected at import.",
  },
  {
    name: "EXIM Levy",
    rate: pct(DEFAULT_RATES.eximLevyRate),
    base: "CIF",
    what: "Funds the Ghana Export-Import Bank.",
  },
  {
    name: "Special Import Levy",
    rate: pct(DEFAULT_RATES.specialImportLevyRate),
    base: "CIF",
    what: "A general levy on imported goods.",
  },
  {
    name: "Examination Fee",
    rate: pct(DEFAULT_RATES.examinationFee),
    base: "CIF",
    what: "Physical examination of the vehicle at the port. Used vehicles only — this is the line most duty calculators leave out.",
  },
  {
    name: "Network Charge",
    rate: pct(DEFAULT_RATES.networkCharge),
    base: "FOB",
    what: "The ICUMS processing charge. Note it is assessed on FOB, and it carries its own VAT, NHIL and GETFund on top.",
  },
];

const FLAT_ROWS = [
  {
    name: "Shippers Network Fee",
    amount: DEFAULT_FLAT_CHARGES.shippersNetworkFee,
    what: "Ghana Shippers Authority.",
  },
  {
    name: "Disinfection Fee",
    amount: DEFAULT_FLAT_CHARGES.disinfectionFee,
    what: "Mandatory fumigation of the vehicle on arrival.",
  },
  {
    name: "MoTI e-IDF",
    amount: DEFAULT_FLAT_CHARGES.idfProcessingFee,
    what: "Electronic Import Declaration Form.",
  },
];

const DUTY_BANDS = [
  { band: "5%", who: "Buses and minibuses — vehicles built to carry ten or more people." },
  { band: "10%", who: "Goods vehicles: pickups, vans and trucks. Electric vehicles also take 10%." },
  { band: "20%", who: "Passenger cars and SUVs — whatever the engine size." },
];

const AGE_BANDS = [
  { label: "Up to 10 years", years: 10 },
  { label: "Over 10, up to 12 years", years: 11 },
  { label: "Over 12, up to 15 years", years: 13 },
  { label: "Over 15, up to 20 years", years: 16 },
  { label: "Over 20 years", years: 21 },
];

export default function TaxesPage() {
  // A worked example, computed by the same engine the calculator uses — so
  // this page can never drift from what we actually quote.
  const example = calculateDuty({
    cifValue: 200_000,
    currency: "GHS",
    manufactureYear: new Date().getFullYear() - 5,
    engineSizeCc: 2500,
    fuelType: "PETROL",
    bodyType: "SEDAN",
    condition: "USED",
    shippingCost: 0,
    portCharges: 0,
    clearingCharges: 0,
    deliveryCost: 0,
    processingFee: 0,
  });

  return (
    <div className="space-y-10">

      {/* At a glance */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Buses & minibuses", value: "29.9%", note: "5% duty band" },
          { label: "Pickups, vans, trucks", value: "35.9%", note: "10% duty band" },
          { label: "Cars & SUVs", value: "47.9%", note: "20% duty band" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border p-5">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums">{card.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">of CIF · {card.note}</p>
          </div>
        ))}
      </section>
      <p className="-mt-6 flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Totals for a new vehicle. A used vehicle adds the 1% examination fee — so a used car or SUV
        lands closer to <strong className="font-semibold text-foreground">48.9% of CIF</strong>,
        before any over-age penalty.
      </p>

      {/* The levies */}
      <section>
        <h3 className="font-display text-lg font-bold">What is charged</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          The base matters as much as the rate. Four of these are charged on the duty-inclusive
          value, which is why the headline rates add up to less than the bill.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-4 font-semibold">Levy</th>
                <th className="pb-2 pr-4 font-semibold">Rate</th>
                <th className="pb-2 pr-4 font-semibold">Charged on</th>
                <th className="pb-2 font-semibold">What it is</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {LEVIES.map((levy) => (
                <tr key={levy.name} className="align-top">
                  <td className="py-3 pr-4 font-medium">{levy.name}</td>
                  <td className="py-3 pr-4 tabular-nums">{levy.rate}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={cn(
                        "whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
                        levy.base === "CIF_PLUS_DUTY"
                          ? "bg-brand-600/10 text-brand-700 dark:text-brand-200"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {LEVY_BASE_LABELS[levy.base]}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">{levy.what}</td>
                </tr>
              ))}
              {FLAT_ROWS.map((row) => (
                <tr key={row.name} className="align-top">
                  <td className="py-3 pr-4 font-medium">{row.name}</td>
                  <td className="py-3 pr-4 tabular-nums">{ghs(row.amount)}</td>
                  <td className="py-3 pr-4">
                    <span className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Fixed charge
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">{row.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* No longer charged */}
      <section className="rounded-2xl border border-success/30 bg-success/5 p-5">
        <h3 className="flex items-center gap-2 font-semibold">
          <Check className="h-4 w-4 text-success" />
          No longer charged
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <strong className="font-medium text-foreground">
              COVID-19 Health Recovery Levy (1%)
            </strong>{" "}
            — withdrawn. If you see it on a quote, that quote is out of date.
          </li>
          <li>
            <strong className="font-medium text-foreground">VAT stacked on NHIL and GETFund</strong>{" "}
            — under the VAT Act, 2025 (Act 1151) the two levies sit alongside VAT on the same base
            rather than inside it. The VAT family is a flat 20% of the duty-inclusive value, down
            from about 21.9%.
          </li>
        </ul>
      </section>

      {/* Duty bands */}
      <section>
        <h3 className="font-display text-lg font-bold">Which duty band applies</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          A common misconception is that engine size sets the duty rate. It does not — the vehicle
          category does.
        </p>
        <dl className="mt-4 divide-y rounded-2xl border">
          {DUTY_BANDS.map((band) => (
            <div key={band.band} className="flex items-baseline gap-4 p-4">
              <dt className="w-14 shrink-0 font-display text-lg font-bold tabular-nums">
                {band.band}
              </dt>
              <dd className="text-sm text-muted-foreground">{band.who}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Over-age penalty */}
      <section>
        <h3 className="font-display text-lg font-bold">Over-age penalty</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Charged on CIF, on top of everything above, once a vehicle passes ten years from its year
          of manufacture. Cars are penalised harder than commercial vehicles.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-4 font-semibold">Vehicle age</th>
                <th className="pb-2 pr-4 font-semibold">Cars & SUVs</th>
                <th className="pb-2 font-semibold">Buses & goods vehicles</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {AGE_BANDS.map((band) => {
                const car = resolveOverAgePenalty(band.years, "PASSENGER_CAR");
                const commercial = resolveOverAgePenalty(band.years, "COMMERCIAL");
                return (
                  <tr key={band.label}>
                    <td className="py-3 pr-4">{band.label}</td>
                    <td className="py-3 pr-4 font-medium tabular-nums">
                      {car === 0 ? "None" : `${car}%`}
                    </td>
                    <td className="py-3 font-medium tabular-nums">
                      {commercial === 0 ? "None" : `${commercial}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Worked example */}
      <section>
        <h3 className="font-display text-lg font-bold">A worked example</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          A five-year-old saloon with a CIF value of {ghs(200_000)}. Computed by the same engine
          behind the landed-cost calculator, so this page cannot drift from what we quote.
        </p>

        <dl className="mt-4 divide-y rounded-2xl border">
          <div className="flex items-baseline justify-between gap-4 p-4">
            <dt className="text-sm font-medium">CIF value</dt>
            <dd className="font-semibold tabular-nums">{ghs(example.cifGhs)}</dd>
          </div>
          {example.taxLineItems.map((line) => (
            <div key={line.key} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
              <dt className="min-w-0 text-sm text-muted-foreground">
                <span className="block">{line.label}</span>
                {line.base && line.base !== "FLAT" && (
                  <span className="block text-xs text-muted-foreground/70">
                    on {LEVY_BASE_LABELS[line.base]}
                    {line.baseAmount != null && ` · ${ghs(line.baseAmount)}`}
                  </span>
                )}
              </dt>
              <dd className="shrink-0 tabular-nums">{ghs(line.amount)}</dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-4 bg-muted/40 p-4">
            <dt className="text-sm font-semibold">Total duties & levies</dt>
            <dd className="font-display text-lg font-bold tabular-nums">
              {ghs(example.taxesSubtotal)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-muted-foreground">As a share of CIF</dt>
            <dd className="font-semibold tabular-nums">{example.effectiveTaxRate.toFixed(2)}%</dd>
          </div>
        </dl>
      </section>

      {/* The caveat that matters */}
      <section className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
        <h3 className="flex items-center gap-2 font-semibold">
          <AlertCircle className="h-4 w-4 text-warning" />
          The rates are the easy half
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Getting the formula right still leaves the harder question: what value GRA applies it to.
          Customs does not assess on what you paid — it assesses on the vehicle&apos;s Home Delivery
          Value, its own reference price. A calculator that asks you to type in your purchase price
          is answering a different question from the one the port will ask.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Our{" "}
          <Link href="/app/calculators/import-duty" className="font-medium text-brand-600 underline">
            landed-cost calculator
          </Link>{" "}
          works the other way round: it starts from what GRA actually billed on cars like yours, and
          reprices at today&apos;s exchange rate.
        </p>
      </section>
    </div>
  );
}
