import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Globe, Ship } from "lucide-react";
import { ImportRequestForm } from "@/components/import/import-request-form";
import { IMPORT_STAGES } from "@/lib/constants";

export const metadata: Metadata = { title: "Start an import" };

/**
 * Starting an import, inside the shell.
 *
 * This page used to be the public `/import` — pitch, five-step explainer and
 * all — with the form at the bottom. Someone who has already signed in and
 * navigated to "Start an import" has been sold; making them scroll past the
 * sales copy to reach the form was the marketing page's job leaking into the
 * app's. The pitch now lives at the public `/import`, and this is the form.
 */
export default function StartImportPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/app/calculators/import-duty"
          className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
        >
          <Calculator className="h-4 w-4" /> Price it first
        </Link>
        <Link
          href="/app/imports/mine"
          className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
        >
          <Ship className="h-4 w-4" /> My imports
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <ImportRequestForm />

        <aside>
          <div className="rounded-2xl border bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white lg:sticky lg:top-0">
            <Globe className="h-8 w-8" />
            <h2 className="mt-3 font-display text-xl font-bold">What happens next</h2>
            <p className="mt-2 text-sm text-brand-100">
              We quote the full landed cost before anything is bought. After you approve it, every
              stage below lands in your account with its documents attached.
            </p>
            <ol className="mt-5 space-y-2.5">
              {IMPORT_STAGES.map((stage, i) => (
                <li key={stage.value} className="flex items-center gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
                    {i + 1}
                  </span>
                  {stage.label}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
