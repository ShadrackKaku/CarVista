"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

/**
 * Surfaces the `?verified` / `?registered` / `?error` results of an email link
 * as a toast.
 *
 * This lives apart from `LoginForm` on purpose: it is the only piece that
 * needs `useSearchParams`, so keeping it separate lets the form itself mount
 * inside the auth dialog without dragging a Suspense boundary along with it.
 */
export function AuthQueryToasts() {
  const params = useSearchParams();

  useEffect(() => {
    if (params.get("verified")) toast.success("Email verified! You can now sign in.");
    if (params.get("registered")) toast.success("Account created! Please sign in.");
    if (params.get("error") === "invalid-token") {
      toast.error("Verification link is invalid or expired.");
    }
  }, [params]);

  return null;
}
