"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore, type CartItemSnapshot } from "@/store/cart-store";
import { cn } from "@/lib/utils";
import type { SamplePart } from "@/lib/sample-data";

export function toCartItem(part: SamplePart): CartItemSnapshot {
  return {
    partId: part.id,
    name: part.name,
    slug: part.slug,
    price: part.discountPrice ?? part.price,
    image: part.image,
    storeName: part.store.name,
  };
}

export function AddToCartButton({
  part,
  className,
  size = "sm",
}: {
  part: SamplePart;
  className?: string;
  size?: "sm" | "default" | "lg";
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  function onAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem(toCartItem(part), 1);
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
