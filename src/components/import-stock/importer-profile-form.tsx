"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GHANA_REGIONS } from "@/lib/constants";
import { SOURCE_MARKETS } from "@/lib/import-stock";
import { cn } from "@/lib/utils";
import type { Importer } from "@prisma/client";

/**
 * Edit your own importer profile.
 *
 * Buyers decide whether to wire a five-figure FOB to a stranger partly on what
 * this page says, so the copy asks for the things that actually settle that
 * question — how long you have been shipping, what you source, how to reach a
 * human — rather than treating it as an address book entry.
 */
export function ImporterProfileForm({ importer }: { importer: Importer }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [markets, setMarkets] = useState<string[]>(importer.sourceMarkets);
  const [form, setForm] = useState({
    businessName: importer.businessName,
    description: importer.description ?? "",
    leadTimeDays: importer.leadTimeDays != null ? String(importer.leadTimeDays) : "",
    phone: importer.phone ?? "",
    whatsapp: importer.whatsapp ?? "",
    email: importer.email ?? "",
    website: importer.website ?? "",
    city: importer.city ?? "",
    region: importer.region ?? "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/importer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          leadTimeDays: form.leadTimeDays === "" ? undefined : form.leadTimeDays,
          sourceMarkets: markets,
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
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border p-4 text-sm",
          importer.verified ? "bg-success/5" : "bg-muted/40",
        )}
      >
        <BadgeCheck
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0",
            importer.verified ? "text-success" : "text-muted-foreground",
          )}
        />
        <p className="text-muted-foreground">
          {importer.verified ? (
            <>
              Your business is <span className="font-medium text-foreground">verified</span>. The
              badge shows on every car you list.
            </>
          ) : (
            <>
              Not verified yet. Buyers see the badge on verified importers, and it is the single
              biggest thing that gets a first FOB transfer sent. Send your business registration
              to the team to start the check.
            </>
          )}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business name</Label>
          <Input
            id="businessName"
            required
            value={form.businessName}
            onChange={(e) => set("businessName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">How you work, in your own words</Label>
          <Textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Which auctions you buy from, how long you have been shipping to Tema, what you do if a car arrives damaged."
          />
        </div>
      </div>

      <div>
        <Label>Where you source from</Label>
        <p className="mt-1 text-sm text-muted-foreground">
          Buyers filter stock by market. With none selected you are missing from every filter.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SOURCE_MARKETS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={markets.includes(m)}
              onClick={() =>
                setMarkets((cur) =>
                  cur.includes(m) ? cur.filter((v) => v !== m) : [...cur, m],
                )
              }
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                markets.includes(m)
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="leadTimeDays">Typical door-to-Tema time (days)</Label>
          <Input
            id="leadTimeDays"
            type="number"
            min={1}
            max={365}
            value={form.leadTimeDays}
            onChange={(e) => set("leadTimeDays", e.target.value)}
            placeholder="45"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="0201234567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Contact email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <select
            id="region"
            value={form.region}
            onChange={(e) => set("region", e.target.value)}
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
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://"
          />
        </div>
      </div>

      <Button type="submit" variant="gradient" size="lg" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save profile
      </Button>
    </form>
  );
}
