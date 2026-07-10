import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Globe, Search, Ship, ShieldCheck, Truck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ImportRequestForm } from "@/components/import/import-request-form";
import { IMPORT_STAGES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Import a Car to Ghana — End-to-End Vehicle Import Service",
  description:
    "Import any vehicle to Ghana with CarVista. We source from US, UK, Germany, Japan & Dubai auctions, ship, clear customs and deliver to your door.",
  alternates: { canonical: "/import" },
};

const steps = [
  { icon: Search, title: "1. Tell us what you want", desc: "Share the make, model, year and budget. We search global auctions." },
  { icon: Calculator, title: "2. Get a full quotation", desc: "We send you the CIF, duty and shipping — the complete landed cost." },
  { icon: Ship, title: "3. We buy & ship", desc: "Once you approve, we purchase and ship to Tema or Takoradi port." },
  { icon: ShieldCheck, title: "4. We clear customs", desc: "Our licensed agents handle GRA customs clearance end to end." },
  { icon: Truck, title: "5. Delivered to you", desc: "We deliver the vehicle to your location, ready to register." },
];

export default function ImportPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Vehicle Import"
        title="Import any car to Ghana — stress-free"
        description="From US, UK, German, Japanese and Dubai auctions to your doorstep. We source, ship, clear and deliver — with transparent pricing every step of the way."
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/calculators/import-duty"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Calculator className="h-4 w-4" /> Calculate duty first
          </Link>
          <Link
            href="/dashboard/imports"
            className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-accent"
          >
            <Ship className="h-4 w-4" /> Track my import
          </Link>
        </div>
      </PageHeader>

      <div className="container-page py-12">
        {/* How it works */}
        <section>
          <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">How it works</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step) => (
              <div key={step.title} className="rounded-2xl border bg-card p-5 shadow-soft">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                  <step.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Request form + tracking stages */}
        <section className="mt-16 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <ImportRequestForm />

          <div>
            <div className="rounded-2xl border bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
              <Globe className="h-8 w-8" />
              <h3 className="mt-3 font-display text-xl font-bold">Track every stage</h3>
              <p className="mt-2 text-sm text-brand-100">
                Once your import is underway, follow it live from purchase to delivery.
              </p>
              <ol className="mt-5 space-y-2.5">
                {IMPORT_STAGES.map((stage, i) => (
                  <li key={stage.value} className="flex items-center gap-3 text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
                      {i + 1}
                    </span>
                    {stage.label}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
