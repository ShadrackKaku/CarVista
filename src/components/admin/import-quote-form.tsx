"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Quote = { cif: number | null; duty: number | null; shipping: number | null; total: number | null };

export function ImportQuoteForm({ id, quote }: { id: string; quote: Quote }) {
  const router = useRouter();
  const [cif, setCif] = useState(quote.cif?.toString() ?? "");
  const [duty, setDuty] = useState(quote.duty?.toString() ?? "");
  const [shipping, setShipping] = useState(quote.shipping?.toString() ?? "");
  const [loading, setLoading] = useState(false);

  const num = (v: string) => (v.trim() === "" ? undefined : Number(v));
  const total =
    (num(cif) ?? 0) + (num(duty) ?? 0) + (num(shipping) ?? 0) || undefined;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/imports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "quote",
          quotedCif: num(cif),
          quotedDuty: num(duty),
          quotedShipping: num(shipping),
          quotedTotal: total,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not save the quote");
        return;
      }
      toast.success("Quote saved");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">CIF value (GHS)</Label>
          <Input type="number" min="0" value={cif} onChange={(e) => setCif(e.target.value)} placeholder="0" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Duty (GHS)</Label>
          <Input type="number" min="0" value={duty} onChange={(e) => setDuty(e.target.value)} placeholder="0" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Shipping (GHS)</Label>
          <Input type="number" min="0" value={shipping} onChange={(e) => setShipping(e.target.value)} placeholder="0" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Guaranteed landed total:{" "}
        <span className="font-semibold text-foreground">
          {total ? `GHS ${total.toLocaleString("en-GH")}` : "—"}
        </span>
      </p>
      <Button type="submit" variant="outline" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save quote
      </Button>
    </form>
  );
}
