"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";

export function AddToCartButton({
  partId,
  className,
  size = "sm",
}: {
  partId: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  function onAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem(partId, 1);
    setAdded(true);
    toast.success("Added to cart");
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Button
      onClick={onAdd}
      size={size}
      variant={added ? "success" : "default"}
      className={cn(className)}
    >
      {added ? (
        <>
          <Check className="h-4 w-4" /> Added
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" /> Add to cart
        </>
      )}
    </Button>
  );
}
