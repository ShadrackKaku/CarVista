import { DEFAULT_RATES } from "@/lib/duty-calculator";

const rateRows = [
  { label: "Import Duty (saloon/SUV)", value: `${DEFAULT_RATES.importDutyRate}%` },
  { label: "VAT", value: `${DEFAULT_RATES.vatRate}%` },
  { label: "NHIL", value: `${DEFAULT_RATES.nhilRate}%` },
  { label: "GETFund Levy", value: `${DEFAULT_RATES.getfundRate}%` },
  { label: "COVID-19 Health Levy", value: `${DEFAULT_RATES.covidLevyRate}%` },
  { label: "ECOWAS Levy", value: `${DEFAULT_RATES.ecowasLevyRate}%` },
  { label: "Examination Fee", value: `${DEFAULT_RATES.examinationFee}%` },
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
          <div key={row.label} className="flex items-center justify-between py-2.5 text-sm">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="font-semibold">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        Rates are maintained by CarVista admins in line with GRA / MoF directives and can change at
        any time.
      </p>
    </div>
  );
}
