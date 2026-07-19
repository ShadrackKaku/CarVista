"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Admin control to refund a paid parts order. Shows the current refund state,
 * or a Refund button when the order is eligible.
 */
export function OrderRefundButton({
  orderId,
  refundable,
  refundStatus,
}: {
  orderId: string;
  refundable: boolean;
  refundStatus: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (refundStatus === "REFUNDED") {
    return <span className="text-xs font-medium text-muted-foreground">Refunded</span>;
  }
  if (refundStatus === "PENDING") {
    return <span className="text-xs font-medium text-brand-600">Refunding…</span>;
  }
  if (refundStatus === "FAILED") {
    return <span className="text-xs font-medium text-destructive">Refund failed</span>;
  }
  if (!refundable) return <span className="text-xs text-muted-foreground">—</span>;

  async function refund() {
    if (!window.confirm("Refund this order to the customer? This can't be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not start the refund");
        return;
      }
      toast.success("Refund started — it'll settle to the customer shortly.");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={busy}
      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
      onClick={refund}
    >
      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      Refund
    </Button>
  );
}
