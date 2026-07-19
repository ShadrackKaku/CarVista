"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { describeQuery } from "@/lib/vehicle-search";
import { formatDate } from "@/lib/utils";

export function SavedSearchRow({
  id,
  name,
  query,
  createdAt,
}: {
  id: string;
  name: string;
  query: string;
  createdAt: Date;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/saved-searches/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Could not delete");
        return;
      }
      toast.success("Search removed");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-soft">
      <div className="min-w-0">
        <p className="font-semibold">{name}</p>
        <p className="truncate text-sm text-muted-foreground">{describeQuery(query)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Saved {formatDate(createdAt)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button asChild size="sm" variant="gradient">
          <Link href={`/vehicles${query ? `?${query}` : ""}`}>
            <Search className="h-4 w-4" /> Run
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={busy}
          onClick={remove}
          aria-label="Delete saved search"
          className="text-muted-foreground hover:text-destructive"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
