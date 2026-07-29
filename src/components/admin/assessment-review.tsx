"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Verify / reject actions for a duty-assessment submission. */
export function AssessmentReview({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (status === "VERIFIED") {
    return <span className="text-xs font-medium text-success">Verified</span>;
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
    </div>
  );
}
