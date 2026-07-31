import Link from "next/link";
import { Gauge, Target } from "lucide-react";
import { getBacktestObservations, getCoverageStats } from "@/lib/queries";
import { backtest } from "@/lib/landed-cost";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

export default async function AdminAccuracyPage() {
  const [rows, coverage] = await Promise.all([
    getBacktestObservations(),
    getCoverageStats(),
  ]);

  const result = backtest(
    rows.map((r) => r.observation),
    { labelOf: (_o, i) => rows[i]?.label ?? `#${i + 1}` },
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-2">
        <Gauge className="h-6 w-6 text-brand-600" />
        <h1 className="font-display text-2xl font-bold">Estimate accuracy</h1>
      </div>
      <p className="mt-1 text-muted-foreground">
        Every verified assessment is held out in turn and predicted from the others — so this
        is what the engine would have quoted <em>before</em> each car cleared.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {[
          { label: "Assessments", value: coverage.assessments },
          { label: "Verified", value: coverage.verified },
          { label: "HDV references", value: coverage.hdvReferences },
          { label: "Models covered", value: coverage.distinctModels },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {!result ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
          <Target className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">Not enough data to score yet</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            The backtest needs at least three verified assessments that carry an HDV and an
            exchange rate. Import a few more cohorts from the ICUMS checker.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-4">
            <Link href="/admin/assessments/import">Import from ICUMS</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border-2 border-brand-200 bg-card p-4 dark:border-brand-900">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Median error
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-brand-700 tabular-nums dark:text-brand-400">
                {pct(result.medianAbsPctError)}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                90th percentile
              </p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                {pct(result.p90AbsPctError)}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Within 1%
              </p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                {result.withinOnePct}/{result.sampleSize}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Within 5%
              </p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                {result.withinFivePct}/{result.sampleSize}
              </p>
            </div>
          </div>

          <h2 className="mt-8 font-display text-lg font-bold">Biggest misses</h2>
          <p className="text-sm text-muted-foreground">
            Worth a look: a large miss usually means an odd valuation, a different tax class,
            or a GRA rate change.
          </p>
          <div className="mt-3 overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-3 font-medium">Vehicle</th>
                  <th className="p-3 font-medium">Predicted</th>
                  <th className="p-3 font-medium">Actual</th>
                  <th className="p-3 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {result.worstCases.map((c, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-3">{c.label}</td>
                    <td className="p-3 tabular-nums">{formatCurrency(c.predicted)}</td>
                    <td className="p-3 tabular-nums">{formatCurrency(c.actual)}</td>
                    <td
                      className={
                        Math.abs(c.pctError) > 0.05
                          ? "p-3 font-semibold text-destructive tabular-nums"
                          : "p-3 tabular-nums"
                      }
                    >
                      {c.pctError > 0 ? "+" : ""}
                      {pct(c.pctError)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
