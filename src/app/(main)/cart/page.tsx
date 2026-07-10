"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cart-store";
import { getPartById } from "@/lib/sample-data";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const { items, setQuantity, removeItem } = useCartStore();

  const lines = items
    .map((line) => {
      const part = getPartById(line.partId);
      return part ? { part, quantity: line.quantity } : null;
    })
    .filter(Boolean) as { part: NonNullable<ReturnType<typeof getPartById>>; quantity: number }[];

  const subtotal = lines.reduce(
    (sum, l) => sum + (l.part.discountPrice ?? l.part.price) * l.quantity,
    0,
  );
  const shipping = subtotal > 0 ? (subtotal > 2000 ? 0 : 60) : 0;
  const total = subtotal + shipping;

  if (lines.length === 0) {
    return (
      <div className="container-page flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-9 w-9 text-muted-foreground" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Browse parts and add items to get started.</p>
        <Button asChild variant="gradient" className="mt-6">
          <Link href="/parts">Shop car parts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight">Shopping Cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {lines.map(({ part, quantity }) => (
            <div key={part.id} className="flex gap-4 rounded-xl border bg-card p-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={part.image} alt={part.name} fill sizes="96px" className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/parts/${part.slug}`} className="font-semibold hover:text-brand-600">
                      {part.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{part.brand} · {part.store.name}</p>
                  </div>
                  <button
                    onClick={() => removeItem(part.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-lg border">
                    <button
                      onClick={() => setQuantity(part.id, quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center hover:bg-accent"
                      aria-label="Decrease"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(part.id, quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center hover:bg-accent"
                      aria-label="Increase"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="font-semibold text-brand-700 dark:text-brand-400">
                    {formatCurrency((part.discountPrice ?? part.price) * quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside>
          <div className="sticky top-24 rounded-xl border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Order summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="font-medium">{shipping === 0 ? "Free" : formatCurrency(shipping)}</dd>
              </div>
              {subtotal < 2000 && (
                <p className="text-xs text-muted-foreground">
                  Add {formatCurrency(2000 - subtotal)} more for free delivery.
                </p>
              )}
            </dl>
            <Separator className="my-4" />
            <div className="flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-display text-xl font-bold text-brand-700 dark:text-brand-400">
                {formatCurrency(total)}
              </span>
            </div>
            <Button asChild variant="gradient" className="mt-5 w-full" size="lg">
              <Link href="/checkout">Proceed to checkout</Link>
            </Button>
            <Button asChild variant="ghost" className="mt-2 w-full">
              <Link href="/parts">Continue shopping</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
