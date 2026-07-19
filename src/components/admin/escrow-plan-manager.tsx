"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { IMPORT_STAGES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { EscrowPlanView } from "@/lib/queries";

function stageLabel(stage: string) {
  return IMPORT_STAGES.find((s) => s.value === stage)?.label ?? stage;
}

const STATUS_VARIANT: Record<string, "brand" | "success" | "secondary" | "destructive"> = {
  DRAFT: "secondary",
  ACTIVE: "brand",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

/**
 * Admin control for an import's milestone escrow plan: create it from the quote
 * (20/30/30/20 template), activate it so the buyer can start paying, and track
 * each installment.
 */
export function EscrowPlanManager({
  importId,
  escrow,
  quoteTotal,
}: {
  importId: string;
  escrow: EscrowPlanView | null;
  quoteTotal: number | null;
}) {
  const router = useRouter();
  const [total, setTotal] = useState(
    (escrow?.totalAmount ?? quoteTotal ?? "").toString(),
  );
  const [busy, setBusy] = useState(false);

  async function createPlan(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/imports/${importId}/escrow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalAmount: Number(total), useTemplate: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not create the plan");
        return;
      }
      toast.success("Plan created — review, then activate.");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function act(action: "activate" | "cancel" | "reopen") {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/imports/${importId}/escrow`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not update the plan");
        return;
      }
      toast.success(
        action === "activate"
          ? "Plan activated — the buyer can now pay."
          : action === "cancel"
            ? "Plan cancelled."
            : "Plan reopened for editing.",
      );
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function refund(milestoneId: string) {
    if (!window.confirm("Refund this installment to the buyer? This can't be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/imports/${importId}/escrow/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not start the refund");
        return;
      }
      toast.success("Refund started — it'll settle to the buyer shortly.");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  // ── No plan yet: offer to build one from the quote ──────────────
  if (!escrow) {
    return (
      <form onSubmit={createPlan} className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Split the landed cost into protected installments (20% deposit · 30% purchased · 30%
          customs · 20% final). The buyer only pays each as its import stage is verified.
        </p>
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Total amount (GHS)</Label>
            <Input
              type="number"
              min="1"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              placeholder="e.g. 120000"
              className="w-48"
            />
          </div>
          <Button type="submit" variant="outline" disabled={busy || !Number(total)}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Create plan
          </Button>
        </div>
      </form>
    );
  }

  // ── Plan exists: show installments + lifecycle actions ──────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant={STATUS_VARIANT[escrow.status] ?? "secondary"}>{escrow.status}</Badge>
        <span className="text-sm text-muted-foreground">
          {formatCurrency(escrow.paidAmount)} / {formatCurrency(escrow.totalAmount)} paid
        </span>
      </div>

      <ul className="space-y-2">
        {escrow.milestones.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <span className="font-medium">{m.label}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                unlocks at {stageLabel(m.unlockStage)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{formatCurrency(m.amount)}</span>
              {m.refundStatus !== "NONE" ? (
                <span
                  className={
                    "text-xs font-medium " +
                    (m.refundStatus === "REFUNDED"
                      ? "text-muted-foreground"
                      : m.refundStatus === "FAILED"
                        ? "text-destructive"
                        : "text-brand-600")
                  }
                >
                  {m.refundStatus === "REFUNDED"
                    ? "Refunded"
                    : m.refundStatus === "FAILED"
                      ? "Refund failed"
                      : "Refunding…"}
                </span>
              ) : (
                <span
                  className={
                    "text-xs font-medium " +
                    (m.status === "PAID"
                      ? "text-success"
                      : m.payable
                        ? "text-brand-600"
                        : "text-muted-foreground")
                  }
                >
                  {m.status === "PAID"
                    ? "Paid"
                    : m.status === "PROCESSING"
                      ? "Processing"
                      : m.payable
                        ? "Payable"
                        : "Locked"}
                </span>
              )}
              {m.status === "PAID" && m.refundStatus === "NONE" && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                  onClick={() => refund(m.id)}
                >
                  Refund
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        {escrow.status === "DRAFT" && (
          <Button variant="gradient" size="sm" disabled={busy} onClick={() => act("activate")}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Activate plan
          </Button>
        )}
        {(escrow.status === "ACTIVE" || escrow.status === "CANCELLED") &&
          escrow.paidAmount === 0 && (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => act("reopen")}>
              Reopen &amp; edit
            </Button>
          )}
        {escrow.status !== "CANCELLED" && escrow.status !== "COMPLETED" && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            className="text-destructive hover:text-destructive"
            onClick={() => act("cancel")}
          >
            Cancel plan
          </Button>
        )}
      </div>
    </div>
  );
}
