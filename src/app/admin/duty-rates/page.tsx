import { DutyRatesEditor } from "@/components/admin/duty-rates-editor";
import { LiveRates } from "@/components/calculators/live-rates";
import { guardPage } from "@/lib/page-guard";

export default async function AdminDutyRatesPage() {
  await guardPage("duty:manage");
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <DutyRatesEditor />
        <LiveRates />
      </div>
    </div>
  );
}
