"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GHANA_REGIONS } from "@/lib/constants";
import { ROLE_PROFILES, APPLICABLE_ROLES } from "@/lib/roles";
import { STAFF_PRESETS, PERMISSIONS, presetById } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type Result = {
  inviteUrl: string;
  whatsappUrl: string | null;
  emailed: boolean;
  /** Why it didn't send, when it didn't. */
  mailProblem: "not-configured" | "failed" | null;
  expiresInDays: number;
  user: { name: string | null; email: string };
};

/**
 * Create an account for somebody you have already dealt with.
 *
 * No password field anywhere, on purpose. The person sets their own through a
 * one-time link, so nothing that could be used to sign in as them passes
 * through this form, the admin's memory, or a WhatsApp thread.
 */
export function CreateAccountForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "DEALER" as string,
    preset: "content_editor",
    businessName: "",
    city: "",
    region: "",
    message: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isStaff = form.role === "STAFF";
  const needsBusiness = form.role !== "USER" && form.role !== "STAFF";
  const chosenPreset = presetById(form.preset);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          ...(isStaff ? { preset: form.preset } : {}),
          ...(needsBusiness
            ? {
                businessName: form.businessName,
                city: form.city,
                region: form.region,
                message: form.message,
              }
            : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not create the account");
        return;
      }
      setResult(data);
      if (data.emailed) toast.success("Account created and invite sent.");
      // A warning rather than a success: the account is real but the person has
      // not heard about it, and the admin has to do something about that.
      else toast.warning("Account created, but the invite email did not send.");
      // Deliberately no router.refresh() here. It remounts this component and
      // takes the invite link off the screen — and the link is the whole
      // fallback for when the email did not go. The list on the right is
      // refreshed when the admin moves on instead.
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-5 rounded-2xl border bg-card p-6">
        <div>
          <h2 className="font-semibold">
            {result.user.name}&apos;s account is ready
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.emailed ? (
              <>
                An invite went to <span className="font-medium">{result.user.email}</span>. They
                choose their own password — you never see it.
              </>
            ) : (
              <>
                The account exists, but the invite email did{" "}
                <span className="font-medium">not</span> send
                {result.mailProblem === "not-configured"
                  ? " — this deployment has no email provider set up."
                  : " — the email provider rejected it."}{" "}
                Pass the link on yourself using one of the options below.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {result.whatsappUrl && (
            <Button asChild variant="outline">
              <a href={result.whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                Send on WhatsApp
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(result.inviteUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy invite link"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          The link works once and expires in {result.expiresInDays} days. Treat it like a key:
          anyone holding it can set the password on this account.
        </p>

        <div className="flex gap-2 border-t pt-4">
          <Button
            variant="gradient"
            onClick={() => {
              setResult(null);
              setForm((f) => ({ ...f, name: "", email: "", phone: "", businessName: "" }));
              // Now that the link is no longer needed on screen, bring the
              // "who has access" list up to date.
              router.refresh();
            }}
          >
            Create another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-semibold">Who is this for?</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="phone">Phone (for the WhatsApp invite)</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="0244000111"
            />
            <p className="text-xs text-muted-foreground">
              Optional. With a number here you get a one-tap WhatsApp message to send them.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-semibold">What are they?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This grants the role directly — they don&apos;t have to apply for it afterwards.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {(["USER", ...APPLICABLE_ROLES, "STAFF"] as const).map((role) => {
            const label =
              role === "USER"
                ? "Ordinary account"
                : role === "STAFF"
                  ? "CarVista team member"
                  : ROLE_PROFILES[role].label;
            const blurb =
              role === "USER"
                ? "Can browse, save and buy. No business tools."
                : role === "STAFF"
                  ? "Works for CarVista. You choose what they can do below."
                  : ROLE_PROFILES[role].blurb;
            return (
              <button
                key={role}
                type="button"
                aria-pressed={form.role === role}
                onClick={() => set("role", role)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  form.role === role
                    ? "border-brand-600 bg-brand-600/5"
                    : "hover:bg-accent",
                )}
              >
                <span className="block text-sm font-medium">{label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{blurb}</span>
              </button>
            );
          })}
        </div>
      </section>

      {isStaff && (
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold">What may they do?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Staff see only the parts of the console their job needs. You can change this later.
          </p>
          <div className="mt-4 space-y-2">
            {STAFF_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                aria-pressed={form.preset === preset.id}
                onClick={() => set("preset", preset.id)}
                className={cn(
                  "block w-full rounded-xl border p-3 text-left transition-colors",
                  form.preset === preset.id ? "border-brand-600 bg-brand-600/5" : "hover:bg-accent",
                )}
              >
                <span className="block text-sm font-medium">{preset.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{preset.blurb}</span>
              </button>
            ))}
          </div>

          {chosenPreset && (
            <div className="mt-4 rounded-xl bg-muted/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Exactly what that allows
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {chosenPreset.permissions.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    {PERMISSIONS[p]}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {needsBusiness && (
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold">Their business</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sets up their profile so they can start straight away instead of filling this in
            themselves.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input
                id="businessName"
                required
                value={form.businessName}
                onChange={(e) => set("businessName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-1.5">
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
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="message">Notes for their profile</Label>
              <Textarea
                id="message"
                rows={3}
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                placeholder="What they sell, how long they've been trading."
              />
            </div>
          </div>
        </section>
      )}

      <div className="flex justify-end border-t pt-5">
        <Button type="submit" variant="gradient" size="lg" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account and send invite
        </Button>
      </div>
    </form>
  );
}
