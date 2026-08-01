import { DEFAULT_RATES, DEFAULT_FLAT_CHARGES } from "@/lib/duty-calculator";

const ghs = (n: number) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(n);

const rateRows: { label: string; value: string; base: string }[] = [
  { label: "Import Duty", value: `${DEFAULT_RATES.importDutyRate}%`, base: "CIF" },
  { label: "VAT", value: `${DEFAULT_RATES.vatRate}%`, base: "CIF + duty" },
  { label: "NHIL", value: `${DEFAULT_RATES.nhilRate}%`, base: "CIF + duty" },
  { label: "GETFund Levy", value: `${DEFAULT_RATES.getfundRate}%`, base: "CIF + duty" },
  { label: "ECOWAS Levy", value: `${DEFAULT_RATES.ecowasLevyRate}%`, base: "CIF" },
  { label: "African Union Levy", value: `${DEFAULT_RATES.auLevyRate}%`, base: "CIF" },
  { label: "EXIM Levy", value: `${DEFAULT_RATES.eximLevyRate}%`, base: "CIF" },
  { label: "Special Import Levy", value: `${DEFAULT_RATES.specialImportLevyRate}%`, base: "CIF" },
  { label: "Examination Fee", value: `${DEFAULT_RATES.examinationFee}%`, base: "CIF · used only" },
  { label: "Network Charge", value: `${DEFAULT_RATES.networkCharge}%`, base: "FOB" },
  { label: "Shippers Network Fee", value: ghs(DEFAULT_FLAT_CHARGES.shippersNetworkFee), base: "fixed" },
  { label: "Disinfection", value: ghs(DEFAULT_FLAT_CHARGES.disinfectionFee), base: "fixed" },
  { label: "MoTI e-IDF", value: ghs(DEFAULT_FLAT_CHARGES.idfProcessingFee), base: "fixed" },
];

export function LiveRates() {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Current Ghana rates</h3>
        <span className="flex items-center gap-1.5 text-xs font-medium text-success">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Live
        </span>
      </div>
      <dl className="mt-4 divide-y">
        {rateRows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
            <dt className="min-w-0">
              <span className="block truncate text-muted-foreground">{row.label}</span>
              <span className="block text-[11px] text-muted-foreground/70">on {row.base}</span>
            </dt>
            <dd className="shrink-0 font-semibold tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        Assessed under the VAT Act, 2025 (Act 1151) — NHIL and GETFund sit alongside VAT on the
        duty-inclusive value rather than inside its base. The COVID-19 Health Recovery Levy has been
        withdrawn and is no longer charged.
      </p>
    </div>
  );
}
