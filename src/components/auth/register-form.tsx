"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES = [
  { value: "CUSTOMER", label: "Buyer / Customer" },
  { value: "DEALER", label: "Car Dealer" },
  { value: "PARTS_SELLER", label: "Parts Seller" },
  { value: "SERVICE_PROVIDER", label: "Service Provider" },
];

export interface RegisterFormProps {
  /** Where to land once the new account is signed in. */
  callbackUrl?: string;
  /**
   * Called instead of navigating, after the new account has been signed in.
   * The dialog uses this to close itself and stay put.
   */
  onSuccess?: () => void;
  /** Unique-ify field ids when the form is mounted twice (page + dialog). */
  idPrefix?: string;
  /** Compact spacing for the dialog, where vertical room is tight. */
  compact?: boolean;
}

export function RegisterForm({
  callbackUrl,
  onSuccess,
  idPrefix = "register",
  compact = false,
}: RegisterFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "CUSTOMER",
  });

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Those passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Registration failed");
        return;
      }

      // Sign the new account straight in — asking someone to re-type the
      // credentials they just chose is friction with nothing behind it.
      const signInRes = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (signInRes?.error) {
        // The account exists; only the automatic sign-in failed.
        toast.success("Account created! Please sign in.");
        if (!onSuccess) router.push("/login?registered=1");
        return;
      }

      toast.success("Welcome to CarVista!");
      if (onSuccess) {
        onSuccess();
        router.refresh();
        return;
      }
      router.push(callbackUrl ?? "/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Full name</Label>
        <Input
          id={`${idPrefix}-name`}
          required
          autoComplete="name"
          placeholder="Kwame Mensah"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />
      </div>
      <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2"}>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-email`}>Email</Label>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            required
            autoComplete="email"
            placeholder="you@email.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-phone`}>Phone</Label>
          <Input
            id={`${idPrefix}-phone`}
            autoComplete="tel"
            placeholder="0201234567"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-role`}>I want to</Label>
        <Select value={form.role} onValueChange={(v) => update("role", v)}>
          <SelectTrigger id={`${idPrefix}-role`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2"}>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-password`}>Password</Label>
          <Input
            id={`${idPrefix}-password`}
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-confirmPassword`}>Confirm</Label>
          <Input
            id={`${idPrefix}-confirmPassword`}
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
          />
        </div>
      </div>
      <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Create account
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline hover:text-foreground">
          Terms
        </Link>{" "}
        &{" "}
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
