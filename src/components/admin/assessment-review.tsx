"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ListTree, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Verify / reject actions for a duty-assessment submission. */
export function AssessmentReview({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  /** Attach the ICUMS "Tax List" tab so we can verify the levy formula. */
  async function addTaxLines() {
    const text = window.prompt(
      "Paste the ICUMS Tax List rows (one levy per line: name, rate, amount)",
    );
    if (!text) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/duty-assessments/${id}/tax-lines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not save the breakdown");
        return;
      }
      toast.success(`Saved ${data.lines?.length ?? 0} levy lines`);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const breakdownButton = (
    <Button
      size="sm"
      variant="ghost"
      disabled={busy}
      className="h-7 px-2 text-xs"
      onClick={addTaxLines}
    >
      <ListTree className="h-3.5 w-3.5" /> Breakdown
    </Button>
  );

  if (status === "VERIFIED") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-success">Verified</span>
        {breakdownButton}
      </div>
    );
  }

  async function review(action: "VERIFY" | "REJECT") {
    let rejectionReason: string | undefined;
    if (action === "REJECT") {
      rejectionReason = window.prompt("Reason for rejection") ?? undefined;
      if (rejectionReason === undefined) return; // cancelled
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/duty-assessments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not update");
        return;
      }
      toast.success(action === "VERIFY" ? "Assessment verified" : "Assessment rejected");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        className="h-7 px-2 text-xs text-success hover:text-success"
        onClick={() => review("VERIFY")}
      >
        <Check className="h-3.5 w-3.5" /> Verify
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={busy}
        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
        onClick={() => review("REJECT")}
      >
        <X className="h-3.5 w-3.5" /> Reject
      </Button>
      {breakdownButton}
    </div>
  );
}
