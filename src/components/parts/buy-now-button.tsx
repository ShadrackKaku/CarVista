"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { toCartItem } from "@/components/parts/add-to-cart-button";
import { cn } from "@/lib/utils";
import type { SamplePart } from "@/lib/sample-data";

export function BuyNowButton({
  part,
  className,
  size = "lg",
}: {
  part: SamplePart;
  className?: string;
  size?: "sm" | "default" | "lg";
}) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [loading, setLoading] = useState(false);

  function onBuy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    addItem(toCartItem(part), 1);
    router.push("/app/marketplace/checkout");
  }

  return (
    <Button
      onClick={onBuy}
      size={size}
      variant="gradient"
      disabled={loading || part.stock <= 0}
      className={cn(className)}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
      Buy now
    </Button>
  );
}
