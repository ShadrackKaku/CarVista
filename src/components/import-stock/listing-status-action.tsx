"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Publish or archive one listing.
 *
 * Separate from the edit form on purpose: correcting a typo and taking a car
 * off the market are different decisions, and an importer fixing a description
 * must not silently unpublish a car buyers are holding units of.
 *
 * The API refuses to archive while a hold is running and says so; that message
 * is surfaced verbatim rather than replaced with a generic failure, because it
 * tells the importer exactly when they can try again.
 */
export function ListingStatusAction({
  listingId,
  status,
}: {
  listingId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const next =
    status === "ACTIVE" || status === "FULLY_RESERVED"
      ? { value: "ARCHIVED", label: "Archive" }
      : { value: "ACTIVE", label: "Publish" };

  async function apply() {
    setBusy(true);
    try {
      const res = await fetch(`/api/import-listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next.value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not change the listing");
        return;
      }
      toast.success(next.value === "ACTIVE" ? "Listing published." : "Listing archived.");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  // A sold-out listing has nothing left to publish or archive meaningfully.
  if (status === "SOLD_OUT") return null;

  return (
    <Button variant="outline" size="sm" onClick={apply} disabled={busy}>
      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {next.label}
    </Button>
  );
}
