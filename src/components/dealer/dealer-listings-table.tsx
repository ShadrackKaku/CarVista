"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { type DealerBulkAction, bulkActionLabel } from "@/lib/dealer-actions";
import type { DealerListingRow } from "@/lib/queries";

const STATUS_VARIANT: Record<string, "success" | "brand" | "warning" | "secondary" | "destructive"> =
  {
    ACTIVE: "brand",
    SOLD: "success",
    DRAFT: "secondary",
    PENDING: "warning",
    ARCHIVED: "secondary",
    REJECTED: "destructive",
  };

export function DealerListingsTable({ listings }: { listings: DealerListingRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const allSelected = listings.length > 0 && selected.size === listings.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(listings.map((l) => l.id)));
  }

  async function apply(action: DealerBulkAction) {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/dealer/listings/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected], action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not update");
        return;
      }
      toast.success(`Updated ${data.updated} listing${data.updated === 1 ? "" : "s"}`);
      setSelected(new Set());
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-accent/40 px-4 py-2.5 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin self-center" />}
            {(["republish", "unpublish", "sold"] as DealerBulkAction[]).map((a) => (
              <Button key={a} size="sm" variant="outline" disabled={busy} onClick={() => apply(a)}>
                {bulkActionLabel(a)}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                </th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {listings.map((v) => (
                <tr key={v.id} className="hover:bg-accent/40">
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selected.has(v.id)}
                      onCheckedChange={() => toggle(v.id)}
                      aria-label={`Select ${v.title}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-16 overflow-hidden rounded-lg bg-muted">
                        <Image src={v.image} alt={v.title} fill sizes="64px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <Link href={`/vehicles/${v.slug}`} className="font-medium hover:text-brand-600">
                          {v.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {v.year} · {v.city || "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(v.price)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> {formatNumber(v.views)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[v.status] ?? "secondary"}>{v.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/vehicles/${v.slug}`}>View</Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/vehicles/${v.slug}/edit`}>Edit</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
