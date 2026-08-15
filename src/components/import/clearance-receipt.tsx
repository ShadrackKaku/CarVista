import { BadgeCheck, Landmark } from "lucide-react";
import { dutyVariance, varianceSummary } from "@/lib/clearing";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * What we said the duty would be, against what it actually was.
 *
 * Published rather than quietly dropped once the real figure is known. A
 * platform willing to show its own misses is making a far stronger claim than
 * one that only ever shows estimates — and for a buyer who has been ambushed by
 * a bill at Tema before, this panel is the entire pitch.
 *
 * The entry number is what turns it from a claim into a receipt: it can be
 * checked against ICUMS by anybody who doubts it.
 */
export function ClearanceReceipt({
  estimatedDuty,
  actualDuty,
  entryNumber,
  agent,
  agentLicensed,
  clearedAt,
}: {
  estimatedDuty: number | null;
  actualDuty: number | null;
  entryNumber: string | null;
  agent: string | null;
  agentLicensed: boolean;
  clearedAt: Date | null;
}) {
  if (actualDuty == null) return null;
  const variance = dutyVariance(estimatedDuty, actualDuty);
  const summary = varianceSummary(variance);

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-2">
        <Landmark className="h-4 w-4 text-brand-600" />
        <h2 className="text-sm font-semibold">Cleared through customs</h2>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        {estimatedDuty != null && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">We estimated</dt>
            <dd className="font-medium">{formatCurrency(estimatedDuty)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Actually paid</dt>
          <dd className="font-display text-lg font-bold text-brand-700 dark:text-brand-400">
            {formatCurrency(actualDuty)}
          </dd>
        </div>
      </dl>

      {summary && (
        <p
          className={cn(
            "mt-3 text-xs font-medium",
            variance?.direction === "over"
              ? "text-warning"
              : variance?.direction === "under"
                ? "text-success"
                : "text-muted-foreground",
          )}
        >
          {summary}
        </p>
      )}

      {entryNumber && (
        <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
          Customs entry <span className="font-medium text-foreground">{entryNumber}</span>
          {clearedAt ? ` · ${formatDate(clearedAt)}` : ""}
        </p>
      )}

      {agent && (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          Cleared by <span className="font-medium text-foreground">{agent}</span>
          {agentLicensed && <BadgeCheck className="h-3.5 w-3.5 text-success" />}
        </p>
      )}
    </div>
  );
}
