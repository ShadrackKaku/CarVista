import type { Metadata } from "next";
import { BadgeCheck, LineChart, ShieldCheck } from "lucide-react";
import { DutyAssessmentForm } from "@/components/import/duty-assessment-form";

export const metadata: Metadata = { title: "Share a duty bill" };

const POINTS = [
  {
    icon: LineChart,
    title: "It sharpens the estimate",
    text: "Every verified assessment tightens the median our calculator quotes from — including the one it gives you next time.",
  },
  {
    icon: ShieldCheck,
    title: "Nothing identifying is published",
    text: "We keep the vehicle and the charges. Your name and documents are never shown to other users.",
  },
  {
    icon: BadgeCheck,
    title: "Reviewed before it counts",
    text: "An admin checks each submission against the ICUMS format before it feeds the engine.",
  },
];

/**
 * The contribution side of the landed-cost engine, inside the shell. The form
 * itself is the same component the public duty-check page uses.
 */
export default function ShareBillPage() {
  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_20rem]">
      <div className="min-w-0">
        <DutyAssessmentForm />
      </div>
      <aside className="space-y-4">
        {POINTS.map((point) => (
          <div key={point.title} className="rounded-2xl border bg-card p-5">
            <point.icon className="h-6 w-6 text-brand-600" aria-hidden />
            <h2 className="mt-3 font-semibold">{point.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{point.text}</p>
          </div>
        ))}
      </aside>
    </div>
  );
}
