"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GHANA_REGIONS } from "@/lib/constants";
import { SUPPLIER_CATEGORIES, SUPPLIER_CATEGORY_LABELS } from "@/lib/suppliers";
import { cn } from "@/lib/utils";
import type { SupplierRow } from "@/lib/queries";

/** Edit your own supplier profile. The API scopes the write to your row. */
export function SupplierProfileForm({ supplier }: { supplier: SupplierRow }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>(supplier.categories);
  const [regions, setRegions] = useState<string[]>(supplier.servesRegions);
  const [form, setForm] = useState({
    businessName: supplier.name,
    description: supplier.description,
    minimumOrder: supplier.minimumOrder ?? "",
    leadTimeDays: supplier.leadTimeDays != null ? String(supplier.leadTimeDays) : "",
    phone: supplier.phone ?? "",
    whatsapp: supplier.whatsapp ?? "",
    website: supplier.website ?? "",
    city: supplier.city,
    region: supplier.region,
  });

  function toggle(list: string[], value: string, set: (v: string[]) => void) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/supplier/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          leadTimeDays: form.leadTimeDays === "" ? undefined : form.leadTimeDays,
          categories,
          servesRegions: regions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not save your profile");
        return;
      }
      toast.success("Profile saved");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business name</Label>
          <Input
            id="businessName"
            required
            value={form.businessName}
            onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">What you supply, in your own words</Label>
          <Textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brands you carry, where you source from, who you usually sell to."
          />
        </div>
      </div>

      <div>
        <Label>Categories</Label>
        <p className="mt-1 text-sm text-muted-foreground">
          Buyers filter the directory by these. With none selected you don&apos;t appear in any
          filter.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUPPLIER_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={categories.includes(c)}
              onClick={() => toggle(categories, c, setCategories)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                categories.includes(c)
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {SUPPLIER_CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="minimumOrder">Minimum order</Label>
          <Input
            id="minimumOrder"
            value={form.minimumOrder}
            onChange={(e) => setForm((f) => ({ ...f, minimumOrder: e.target.value }))}
            placeholder="20 units, or GH¢50,000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="leadTimeDays">Typical lead time (days)</Label>
          <Input
            id="leadTimeDays"
            type="number"
            min={0}
            max={365}
            value={form.leadTimeDays}
            onChange={(e) => setForm((f) => ({ ...f, leadTimeDays: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="0201234567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            value={form.whatsapp}
            onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <select
            id="region"
            value={form.region}
            onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select a region</option>
            {GHANA_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            placeholder="https://"
          />
        </div>
      </div>

      <div>
        <Label>Regions you deliver to</Label>
        <p className="mt-1 text-sm text-muted-foreground">
          Leave all unselected if you deliver nationwide.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {GHANA_REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={regions.includes(r)}
              onClick={() => toggle(regions, r, setRegions)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                regions.includes(r)
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" variant="gradient" size="lg" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save profile
      </Button>
    </form>
  );
}
