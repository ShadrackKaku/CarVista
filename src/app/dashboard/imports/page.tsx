import Link from "next/link";
import { Plus, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImportTimeline } from "@/components/import/import-timeline";
import { getCurrentUser } from "@/lib/session";
import { getUserImports } from "@/lib/queries";
import { IMPORT_STAGES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function stageLabel(stage: string) {
  return IMPORT_STAGES.find((s) => s.value === stage)?.label ?? stage;
}

export default async function ImportsPage() {
  const user = await getCurrentUser();
  const imports = user ? await getUserImports(user.id) : [];

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

      {imports.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
          <Ship className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No imports yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Request a vehicle import and we'll source, ship and clear it for you.
          </p>
          <Button asChild variant="gradient" className="mt-5">
            <Link href="/import">Start an import</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {imports.map((imp) => (
            <div key={imp.ref} className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{imp.title}</h2>
                    <Badge variant="brand">{stageLabel(imp.stage)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ref {imp.ref} · From {imp.origin}
                    {imp.eta ? ` · ETA ${formatDate(imp.eta)}` : ""}
                  </p>
                </div>
                {imp.total > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Quoted total</p>
                    <p className="font-display text-xl font-bold text-brand-700 dark:text-brand-400">
                      {formatCurrency(imp.total)}
                    </p>
                  </div>
                )}
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
      )}
    </div>
  );
}
