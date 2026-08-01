"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface LoginFormProps {
  /** Where to land after a successful sign-in. */
  callbackUrl?: string;
  /**
   * Called instead of navigating. The dialog uses this to close itself and
   * refresh in place rather than pushing the user off the page they were on.
   */
  onSuccess?: () => void;
  /** Unique-ify field ids when the form is mounted twice (page + dialog). */
  idPrefix?: string;
}

/**
 * Deliberately free of `useSearchParams` so it can mount anywhere — including
 * inside a dialog rendered from the root layout — without forcing the tree
 * that contains it to become dynamic.
 */
export function LoginForm({ callbackUrl, onSuccess, idPrefix = "login" }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Welcome back!");
      if (onSuccess) {
        onSuccess();
        router.refresh();
        return;
      }
      router.push(callbackUrl ?? "/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-email`}>Email address</Label>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          autoComplete="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${idPrefix}-password`}>Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id={`${idPrefix}-password`}
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}
