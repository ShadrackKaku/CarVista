import Link from "next/link";
import { ArrowLeft, ClipboardPaste, ExternalLink } from "lucide-react";
import { IcumsImportForm } from "@/components/admin/icums-import-form";

export const dynamic = "force-dynamic";

const ICUMS_CHECKER =
  "https://external.unipassghana.com/cl/tm/tax/selectUsedVehicleTaxCalculate.do?decorator=popup&MENU_ID=IIM01S03V02";

export default function IcumsImportPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/assessments"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Duty data
      </Link>

      <div className="mt-3 flex items-center gap-2">
        <ClipboardPaste className="h-6 w-6 text-brand-600" />
        <h1 className="font-display text-2xl font-bold">Import from ICUMS</h1>
      </div>
      <p className="mt-1 text-muted-foreground">
        Capture real customs outcomes straight from the official checker — the fastest way to
        widen quote coverage. Each import also updates the HDV reference table.
      </p>

      <ol className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          {
            step: "1",
            title: "Search a model",
            body: "Open the ICUMS used-vehicle checker and search by Make, Model and Year.",
          },
          {
            step: "2",
            title: "Copy the table",
            body: "Select the results rows and copy them (Ctrl + C). The header row is optional.",
          },
          {
            step: "3",
            title: "Preview & import",
            body: "Paste below, hit Preview to check what was read, then Import.",
          },
        ].map((s) => (
          <li key={s.step} className="rounded-xl border bg-card p-4">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              {s.step}
            </span>
            <p className="mt-2 font-semibold">{s.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>

      <a
        href={ICUMS_CHECKER}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
      >
        <ExternalLink className="h-4 w-4" /> Open the ICUMS used-vehicle checker
      </a>

      <div className="mt-8">
        <IcumsImportForm />
      </div>
    </div>
  );
}
