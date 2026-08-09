"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

/**
 * Start a hold on one unit.
 *
 * The button says what the money does, because "Reserve" alone hides three
 * things the buyer needs before they pay: how long the hold lasts, that the fee
 * comes off the FOB if they go ahead, and that half of it is gone if they do
 * not. Burying that in terms nobody reads is how chargebacks happen.
 */
export function ReserveButton({
  listingId,
  feeGhs,
  refundRate,
  workingDays,
  available,
}: {
  listingId: string;
  feeGhs: number;
  refundRate: number;
  workingDays: number;
  available: number;
}) {
  const router = useRouter();
  const { status } = useSession();
  const [busy, setBusy] = useState(false);

  async function reserve() {
    if (status !== "authenticated") {
      // A toast alone is a dead end on the public page, where every visitor is
      // signed out — send them somewhere they can act, and back to this car
      // once they have.
      toast.info("Sign in to reserve this car");
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/import-listings/${listingId}/reserve`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not start the reservation");
        return;
      }
      // Straight to Paystack — the hold does not exist until the fee clears.
      window.location.href = data.authorizationUrl;
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (available < 1) {
    return (
      <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
        Every unit is currently on hold. Holds last {workingDays} working days, so check back —
        this often frees up.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button size="lg" className="w-full" onClick={reserve} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        Reserve for {formatCurrency(feeGhs)}
      </Button>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Holds one unit for <span className="font-semibold text-foreground">{workingDays} working
        days</span> while you arrange the FOB transfer. Pay in time and the full{" "}
        {formatCurrency(feeGhs)} comes off the FOB. Miss the window and{" "}
        {formatCurrency(feeGhs * refundRate)} is refunded — the rest covers holding the car off the
        market.
      </p>
    </div>
  );
}
