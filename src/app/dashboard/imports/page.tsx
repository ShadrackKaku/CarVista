import Link from "next/link";
import { Plus, Ship, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/session";
import { getUserImports } from "@/lib/queries";
import { IMPORT_STAGES } from "@/lib/constants";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STAGE_ORDER: string[] = IMPORT_STAGES.map((s) => s.value);
function stageLabel(stage: string) {
  return IMPORT_STAGES.find((s) => s.value === stage)?.label ?? stage;
}
function progressPct(stage: string) {
  if (stage === "CANCELLED") return 0;
  const idx = STAGE_ORDER.indexOf(stage);
  return idx < 0 ? 0 : Math.round(((idx + 1) / STAGE_ORDER.length) * 100);
}

export default async function ImportsPage() {
  const user = await getCurrentUser();
  const imports = user ? await getUserImports(user.id) : [];

  return (
    <div className="mx-auto max-w-4xl">
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
        <div className="mt-8 space-y-5">
          {imports.map((imp) => {
            const pct = progressPct(imp.stage);
            return (
              <Link
                key={imp.id}
                href={`/dashboard/imports/${imp.id}`}
                className="block rounded-2xl border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{imp.title}</h2>
                      <Badge variant={imp.stage === "CANCELLED" ? "destructive" : "brand"}>
                        {stageLabel(imp.stage)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Ref {imp.ref} · From {imp.origin}
                      {imp.eta ? ` · ETA ${formatDate(imp.eta)}` : ""}
                    </p>
                  </div>
                  {imp.total > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Guaranteed total</p>
                      <p className="font-display text-xl font-bold text-brand-700 dark:text-brand-400">
                        {formatCurrency(imp.total)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Journey progress</span>
                    <span className="font-medium tabular-nums">{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Latest update */}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-sm text-muted-foreground">
                    {imp.lastUpdate ? (
                      <>
                        <span className="font-medium text-foreground">{imp.lastUpdate.title}</span>
                        {" · "}
                        {formatRelativeTime(imp.lastUpdate.date)}
                      </>
                    ) : (
                      "Awaiting the first update from your import agent."
                    )}
                  </p>
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600">
                    Track <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
