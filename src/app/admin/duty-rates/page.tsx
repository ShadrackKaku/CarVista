import { DutyRatesEditor } from "@/components/admin/duty-rates-editor";
import { LiveRates } from "@/components/calculators/live-rates";

export default function AdminDutyRatesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Duty & Levy Rates</h1>
        <p className="mt-1 text-muted-foreground">
          Update the rates used across the import duty calculator and vehicle pages. These reflect
          current GRA / Ministry of Finance directives.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <DutyRatesEditor />
        <LiveRates />
      </div>
    </div>
  );
}
