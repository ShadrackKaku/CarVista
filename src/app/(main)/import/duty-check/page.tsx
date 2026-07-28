import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, FileCheck2, ShieldCheck, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DutyAssessmentForm } from "@/components/import/duty-assessment-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Duty Check — Share Your ICUMS Tax Bill",
  description:
    "Cleared a car through Tema or Takoradi? Share your ICUMS tax bill and help make Ghana's vehicle import duties transparent for every importer.",
  alternates: { canonical: "/import/duty-check" },
};

const POINTS = [
  {
    icon: ShieldCheck,
    title: "Fight surprise duty bills",
    text: "Duty is assessed on ICUMS's own valuation (the HDV) — which importers only discover at the port. Real bills make the real numbers visible.",
  },
  {
    icon: TrendingUp,
    title: "Sharper estimates for everyone",
    text: "Every verified bill trains our duty estimator on what GRA actually charged for that exact car — not a guess.",
  },
  {
    icon: FileCheck2,
    title: "Verified before it counts",
    text: "Our team checks each submission against the bill photos before it influences any estimate.",
  },
];

export default function DutyCheckPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Import"
        title="Share your duty bill — make importing fairer"
        description="Cleared a vehicle recently? Enter what ICUMS actually charged. Together we're building Ghana's most accurate picture of real import duties."
      />
      <div className="container-page py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <DutyAssessmentForm />
          </div>
          <aside className="space-y-4">
            {POINTS.map((p) => (
              <div key={p.title} className="rounded-2xl border bg-card p-5 shadow-soft">
                <p.icon className="h-6 w-6 text-brand-600" aria-hidden />
                <h2 className="mt-3 font-semibold">{p.title}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{p.text}</p>
              </div>
            ))}
            <div className="rounded-2xl border bg-card p-5 shadow-soft">
              <Calculator className="h-6 w-6 text-brand-600" aria-hidden />
              <h2 className="mt-3 font-semibold">Planning an import?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Estimate duties and total landed cost before you buy.
              </p>
              <Button asChild size="sm" variant="outline" className="mt-3">
                <Link href="/calculators/import-duty">Open the duty calculator</Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
