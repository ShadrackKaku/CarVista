"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { GHANA_REGIONS } from "@/lib/constants";
import { APPLICABLE_ROLES, ROLE_PROFILES, type ApplicableRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

/**
 * Pick a role, then tell us about the business behind it.
 *
 * Which fields are mandatory comes from `ROLE_PROFILES[role].requires` — the
 * same source the API validates against — so the form can never ask for less
 * than the server insists on.
 */
export function RoleApplicationForm({ currentRole }: { currentRole: string }) {
  const router = useRouter();
  const [role, setRole] = useState<ApplicableRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    businessRegNumber: "",
    phone: "",
    city: "",
    region: "",
    message: "",
  });

  const profile = role ? ROLE_PROFILES[role] : null;
  const requires = profile?.requires ?? [];

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    try {
      const res = await fetch("/api/role-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, requestedRole: role }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not submit your application");
        return;
      }
      toast.success("Application submitted — we'll be in touch once it's reviewed.");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">What would you like to do on CarVista?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account stays exactly as it is until an administrator approves the request.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {APPLICABLE_ROLES.map((r) => {
            const p = ROLE_PROFILES[r];
            const held = currentRole === r;
            const selected = role === r;
            return (
              <button
                key={r}
                type="button"
                disabled={held}
                onClick={() => setRole(r)}
                aria-pressed={selected}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-all",
                  held && "cursor-default opacity-60",
                  selected
                    ? "border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/30 dark:bg-brand-900/20"
                    : "hover:border-brand-300 hover:bg-accent",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{p.label}</span>
                  {held && <Badge variant="success">Current</Badge>}
                  {selected && !held && <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" />}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
              </button>
            );
          })}
        </div>
      </div>

      {profile && (
        <>
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm font-semibold">What approval unlocks</p>
            <ul className="mt-3 space-y-1.5">
              {profile.unlocks.map((u) => (
                <li key={u} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {u}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="businessName"
              label="Business name"
              required={requires.includes("businessName")}
              value={form.businessName}
              onChange={(v) => update("businessName", v)}
              placeholder="Tema Motors Ltd"
            />
            <Field
              id="businessRegNumber"
              label="Business registration number"
              required={requires.includes("businessRegNumber")}
              value={form.businessRegNumber}
              onChange={(v) => update("businessRegNumber", v)}
              placeholder="CS123456789"
            />
            <Field
              id="phone"
              label="Contact phone"
              required={requires.includes("phone")}
              value={form.phone}
              onChange={(v) => update("phone", v)}
              placeholder="0201234567"
            />
            <Field
              id="city"
              label="City"
              required={requires.includes("city")}
              value={form.city}
              onChange={(v) => update("city", v)}
              placeholder="Accra"
            />
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <select
                id="region"
                value={form.region}
                onChange={(e) => update("region", e.target.value)}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Anything else we should know?</Label>
            <Textarea
              id="message"
              rows={4}
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              placeholder="How long you've been trading, what you specialise in, references — whatever helps us review this quickly."
            />
          </div>

          <Button type="submit" variant="gradient" size="lg" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit application
          </Button>
        </>
      )}
    </form>
  );
}

function Field({
  id,
  label,
  required,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  required: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {!required && <span className="ml-1.5 text-xs text-muted-foreground">(optional)</span>}
      </Label>
      <Input
        id={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
