"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IMPORT_COUNTRIES, AUCTION_SOURCES, POPULAR_BRANDS, FUEL_TYPES } from "@/lib/constants";

export function ImportRequestForm() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [form, setForm] = useState({
    countryOfOrigin: "United States",
    auctionSource: "Copart",
    make: "",
    model: "",
    year: new Date().getFullYear() - 3,
    budget: "",
    fuelType: "PETROL",
    color: "",
    auctionLink: "",
    notes: "",
  });

  function update(key: string, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "authenticated") {
      toast.info("Please sign in to submit an import request");
      router.push("/login?callbackUrl=/import");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/import-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, year: Number(form.year), budget: form.budget ? Number(form.budget) : undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Submission failed");
        return;
      }
      setDone(data.request?.requestNumber ?? "IMP-REQUEST");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center shadow-soft">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <h3 className="mt-4 font-display text-xl font-bold">Request submitted!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your reference is <span className="font-semibold text-foreground">{done}</span>. Our import
          team will review and send a full quotation within 24 hours.
        </p>
        <Button asChild variant="gradient" className="mt-6">
          <a href="/dashboard/imports">Track my import</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border bg-card p-6 shadow-soft">
      <h3 className="text-lg font-semibold">Request an import quotation</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us what you want — we'll source it and send you the full landed cost.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Country of origin</Label>
          <Select value={form.countryOfOrigin} onValueChange={(v) => update("countryOfOrigin", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {IMPORT_COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Auction / source</Label>
          <Select value={form.auctionSource} onValueChange={(v) => update("auctionSource", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {AUCTION_SOURCES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Make</Label>
          <Select value={form.make} onValueChange={(v) => update("make", v)}>
            <SelectTrigger><SelectValue placeholder="Select make" /></SelectTrigger>
            <SelectContent>
              {POPULAR_BRANDS.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Model</Label>
          <Input required placeholder="e.g. Camry" value={form.model} onChange={(e) => update("model", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Year</Label>
          <Input type="number" min={1990} value={form.year} onChange={(e) => update("year", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Budget (GHS, optional)</Label>
          <Input type="number" placeholder="e.g. 300000" value={form.budget} onChange={(e) => update("budget", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Fuel type</Label>
          <Select value={form.fuelType} onValueChange={(v) => update("fuelType", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FUEL_TYPES.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Preferred colour</Label>
          <Input placeholder="e.g. Black" value={form.color} onChange={(e) => update("color", e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Auction link (optional)</Label>
          <Input placeholder="https://www.copart.com/lot/..." value={form.auctionLink} onChange={(e) => update("auctionLink", e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Additional notes</Label>
          <Textarea placeholder="Any specific requirements..." value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </div>
      </div>

      <Button type="submit" variant="gradient" size="lg" className="mt-6 w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Get my quotation
      </Button>
    </form>
  );
}
