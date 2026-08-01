"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Generic admin action button: fires a request at an endpoint, then refreshes
 * the server component so the table reflects the new state. Used for verify /
 * approve / reject / suspend / delete actions across the admin dashboards.
 */
export function AdminActionButton({
  endpoint,
  method = "PATCH",
  body,
  children,
  confirmMessage,
  successMessage,
  variant = "outline",
  size = "sm",
  className,
}: {
  endpoint: string;
  method?: "PATCH" | "POST" | "DELETE";
  body?: Record<string, unknown>;
  children: React.ReactNode;
  confirmMessage?: string;
  successMessage?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Action failed");
        return;
      }
      if (successMessage) toast.success(successMessage);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={run} disabled={loading}>
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </Button>
  );
}
