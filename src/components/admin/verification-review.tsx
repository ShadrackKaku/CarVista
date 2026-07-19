"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function VerificationReview({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (status === "APPROVED") {
    return <span className="text-xs font-medium text-success">Approved</span>;
  }

  async function review(action: "approve" | "reject") {
    let reviewNote: string | undefined;
    if (action === "reject") {
      reviewNote = window.prompt("Reason for rejection (shown to the dealer)") ?? undefined;
      if (reviewNote === undefined) return; // cancelled
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/verifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNote }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not update");
        return;
      }
      toast.success(action === "approve" ? "Dealer verified" : "Verification rejected");
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
        onClick={() => review("approve")}
      >
        <Check className="h-3.5 w-3.5" /> Approve
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={busy}
        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
        onClick={() => review("reject")}
      >
        <X className="h-3.5 w-3.5" /> Reject
      </Button>
    </div>
  );
}
