"use client";

import { useState } from "react";
import { Check, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IMPORT_STAGES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { EscrowPlanView } from "@/lib/queries";

function stageLabel(stage: string) {
  return IMPORT_STAGES.find((s) => s.value === stage)?.label ?? stage;
}

/**
 * The buyer's view of their milestone escrow plan. Each installment shows its
 * state, and the one the import has unlocked gets a Pay button that kicks off
 * Paystack checkout (cards + Mobile Money).
 */
export function EscrowPlanCard({ importId, plan }: { importId: string; plan: EscrowPlanView }) {
  const [payingId, setPayingId] = useState<string | null>(null);
  const pct = plan.totalAmount > 0 ? Math.round((plan.paidAmount / plan.totalAmount) * 100) : 0;

  async function pay(milestoneId: string) {
    setPayingId(milestoneId);
    try {
      const res = await fetch(`/api/import-requests/${importId}/escrow/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.authorizationUrl) {
        toast.error(data.error ?? "Could not start payment");
        setPayingId(null);
        return;
      }
      // Hand off to Paystack's hosted checkout.
      window.location.href = data.authorizationUrl;
    } catch {
      toast.error("Something went wrong");
      setPayingId(null);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-brand-600" />
        <h2 className="text-sm font-semibold">Milestone payment plan</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Pay in protected installments — each one only unlocks after we verify the matching step, so
        you never pay ahead of real progress.
      </p>

      {/* Progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Paid so far</span>
          <span className="font-semibold">
            {formatCurrency(plan.paidAmount)}{" "}
            <span className="font-normal text-muted-foreground">
              / {formatCurrency(plan.totalAmount)}
            </span>
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      <ul className="mt-5 space-y-3">
        {plan.milestones.map((m) => {
          const paid = m.status === "PAID";
          const processing = m.status === "PROCESSING";
          return (
            <li
              key={m.id}
              className="flex items-start gap-3 rounded-xl border bg-background/60 p-3"
            >
              <span
                className={
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full " +
                  (paid
                    ? "bg-success/15 text-success"
                    : m.payable
                      ? "bg-brand-50 text-brand-600 dark:bg-brand-900/40"
                      : "bg-muted text-muted-foreground")
                }
              >
                {paid ? <Check className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{m.label}</span>
                  <span className="text-sm font-semibold">{formatCurrency(m.amount)}</span>
                </div>
                {m.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.description}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  {paid ? (
                    <span className="text-xs font-medium text-success">Paid</span>
                  ) : m.payable ? (
                    <Button
                      size="sm"
                      variant="gradient"
                      className="h-8"
                      disabled={payingId === m.id}
                      onClick={() => pay(m.id)}
                    >
                      {payingId === m.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        `Pay ${formatCurrency(m.amount)}`
                      )}
                    </Button>
                  ) : processing ? (
                    <span className="text-xs text-muted-foreground">Payment processing…</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Unlocks at “{stageLabel(m.unlockStage)}”
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-[11px] text-muted-foreground">
        Payments are processed securely by Paystack. CarVista never stores your card or Mobile Money
        details.
      </p>
    </div>
  );
}
