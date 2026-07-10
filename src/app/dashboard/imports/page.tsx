import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImportTimeline } from "@/components/import/import-timeline";
import { formatCurrency } from "@/lib/utils";

const imports = [
  {
    ref: "IMP-8K2L-A9F3",
    title: "2019 Toyota Highlander",
    origin: "United States",
    stage: "IN_TRANSIT",
    stageLabel: "In Transit",
    total: 385000,
    eta: "Mar 2025",
  },
  {
    ref: "IMP-5J1M-B7C2",
    title: "2020 Honda Accord",
    origin: "United States",
    stage: "CUSTOMS_CLEARANCE",
    stageLabel: "Customs Clearance",
    total: 298000,
    eta: "Feb 2025",
  },
];

export default function ImportsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">My Imports</h1>
          <p className="mt-1 text-muted-foreground">Track your vehicle imports in real time.</p>
        </div>
        <Button asChild variant="gradient">
          <Link href="/import">
            <Plus className="h-4 w-4" /> New import
          </Link>
        </Button>
      </div>

      <div className="mt-8 space-y-6">
        {imports.map((imp) => (
          <div key={imp.ref} className="rounded-2xl border bg-card p-6 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{imp.title}</h2>
                  <Badge variant="brand">{imp.stageLabel}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ref {imp.ref} · From {imp.origin} · ETA {imp.eta}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total landed cost</p>
                <p className="font-display text-xl font-bold text-brand-700 dark:text-brand-400">
                  {formatCurrency(imp.total)}
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ImportTimeline currentStage={imp.stage} />
              <div className="rounded-xl bg-muted/40 p-5">
                <h3 className="text-sm font-semibold">Need an update?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Contact your dedicated import agent for the latest on your shipment.
                </p>
                <Button variant="outline" size="sm" className="mt-4">
                  Message agent
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
