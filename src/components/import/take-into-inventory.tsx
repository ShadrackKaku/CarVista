"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Car, Check, Loader2, Store, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * The moment the car stops being a shipment and becomes yours.
 *
 * Two paths, offered once, with no form in between. Everything needed to create
 * the vehicle is already in the system — the importer typed it when they listed
 * the stock and the shipment recorded the rest — so asking the owner to
 * describe the car again here would be asking them to retype our own data.
 *
 * The choice is deliberately not a dialog. A dialog would add a click to reach
 * the two buttons that are the entire decision, and this screen is the payoff
 * for a two-month wait.
 */
export function TakeIntoInventory({
  importId,
  landedCost,
}: {
  importId: string;
  landedCost: number | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"SELL" | "KEEP" | null>(null);

  async function take(intent: "SELL" | "KEEP") {
    setBusy(intent);
    try {
      const res = await fetch(`/api/import-requests/${importId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Already bridged is not really a failure — they pressed twice, or came
        // back to a stale tab. Take them to the car rather than scolding them.
        if (res.status === 409 && data.vehicle?.slug) {
          router.push(`/app/marketplace/listings/${data.vehicle.slug}/edit`);
          return;
        }
        toast.error(data.error ?? "Could not add this car to your inventory");
        return;
      }

      toast.success(
        intent === "SELL"
          ? "Added. Set your price and publish."
          : "Added to your garage, history and all.",
      );
      // Push only. A router.refresh() here races the navigation and cancels
      // it, leaving the owner sitting on the import page wondering whether
      // anything happened — and the destination re-fetches on arrival anyway.
      router.push(data.next);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-6 shadow-soft dark:border-brand-900 dark:bg-brand-950/30">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
          <Check className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold">Cleared — this car is yours</h2>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Add it to your inventory and everything comes with it: the photographs, the specification,
        and the verified history from auction to Tema.
      </p>

      {landedCost != null && (
        <p className="mt-3 text-xs text-muted-foreground">
          Landed cost{" "}
          <span className="font-semibold text-foreground">{formatCurrency(landedCost)}</span> — we
          carry this through so you price against what it really cost you.
        </p>
      )}

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Choice
          icon={<Tag className="h-4 w-4" />}
          label="List it for sale"
          blurb="Opens a listing that's already filled in. You set the price."
          busy={busy === "SELL"}
          disabled={busy !== null}
          onClick={() => take("SELL")}
        />
        <Choice
          icon={<Car className="h-4 w-4" />}
          label="Keep it for myself"
          blurb="Goes to your garage with its passport. List it any time."
          busy={busy === "KEEP"}
          disabled={busy !== null}
          onClick={() => take("KEEP")}
        />
      </div>

      <p className="mt-4 flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <Store className="mt-px h-3 w-3 shrink-0" />
        Nothing goes on the marketplace until you publish it yourself.
      </p>
    </div>
  );
}

function Choice({
  icon,
  label,
  blurb,
  busy,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  blurb: string;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-auto flex-col items-start gap-1 whitespace-normal bg-card p-4 text-left",
        "hover:border-brand-600 hover:bg-card",
      )}
    >
      <span className="flex items-center gap-2 text-sm font-semibold">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {label}
      </span>
      <span className="text-xs font-normal text-muted-foreground">{blurb}</span>
    </Button>
  );
}
