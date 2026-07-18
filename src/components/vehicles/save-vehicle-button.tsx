"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useWishlistStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";

export function SaveVehicleButton({
  vehicleId,
  className,
  initialSaved = false,
}: {
  vehicleId: string;
  className?: string;
  initialSaved?: boolean;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const addToWishlist = useWishlistStore((s) => s.add);
  const removeFromWishlist = useWishlistStore((s) => s.remove);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (status !== "authenticated") {
      toast.info("Sign in to save vehicles");
      router.push("/login");
      return;
    }
    setLoading(true);
    const next = !saved;
    setSaved(next);
    // Optimistically update the wishlist count in the header.
    if (next) addToWishlist(vehicleId);
    else removeFromWishlist(vehicleId);
    try {
      const res = await fetch("/api/saved/vehicles", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId }),
      });
      if (!res.ok) throw new Error();
      toast.success(next ? "Saved to your garage" : "Removed from saved");
    } catch {
      setSaved(!next);
      if (next) removeFromWishlist(vehicleId);
      else addToWishlist(vehicleId);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? "Remove from saved" : "Save vehicle"}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background/80 text-muted-foreground transition-colors hover:text-destructive",
        saved && "border-destructive/30 text-destructive",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-destructive")} />
    </button>
  );
}
