"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, Landmark, Loader2, Smartphone, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "@/store/cart-store";
import { getPartById } from "@/lib/sample-data";
import { GHANA_REGIONS } from "@/lib/constants";
import { formatCurrency, cn } from "@/lib/utils";

const PAYMENT_METHODS = [
  { value: "MOBILE_MONEY", label: "Mobile Money", desc: "MTN, Telecel, AirtelTigo", icon: Smartphone },
  { value: "PAYSTACK", label: "Card (Paystack)", desc: "Visa, Mastercard", icon: CreditCard },
  { value: "BANK_TRANSFER", label: "Bank Transfer", desc: "Direct bank payment", icon: Landmark },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear } = useCartStore();
  const [method, setMethod] = useState("MOBILE_MONEY");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    region: "Greater Accra",
    notes: "",
  });

  const lines = items
    .map((line) => {
      const part = getPartById(line.partId);
      return part ? { part, quantity: line.quantity } : null;
    })
    .filter(Boolean) as { part: NonNullable<ReturnType<typeof getPartById>>; quantity: number }[];

  const subtotal = lines.reduce((s, l) => s + (l.part.discountPrice ?? l.part.price) * l.quantity, 0);
  const shipping = subtotal > 2000 ? 0 : 60;
  const total = subtotal + shipping;

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          method,
          items: lines.map((l) => ({
            partId: l.part.id,
            name: l.part.name,
            price: l.part.discountPrice ?? l.part.price,
            quantity: l.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Checkout failed");
        return;
      }
      clear();
      setDone(data.orderNumber ?? "CV-ORDER");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="container-page flex flex-col items-center justify-center py-24 text-center">
        <CheckCircle2 className="h-16 w-16 text-success" />
        <h1 className="mt-6 font-display text-3xl font-bold">Order placed!</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Your order <span className="font-semibold text-foreground">{done}</span> has been received.
          We'll confirm payment and send tracking details to your email.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild variant="gradient">
            <a href="/dashboard/orders">View my orders</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/parts">Continue shopping</a>
          </Button>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
        <Button asChild variant="gradient" className="mt-6">
          <a href="/parts">Shop parts</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight">Checkout</h1>
      <form onSubmit={placeOrder} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {/* Delivery */}
          <section className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold">Delivery details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Full name</Label>
                <Input required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input required placeholder="0201234567" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Address</Label>
                <Input required value={form.address} onChange={(e) => update("address", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>City / Town</Label>
                <Input required value={form.city} onChange={(e) => update("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Select value={form.region} onValueChange={(v) => update("region", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GHANA_REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Order notes (optional)</Label>
                <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Landmark, delivery instructions..." />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold">Payment method</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-all",
                    method === m.value ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20" : "border-border hover:border-brand-300",
                  )}
                >
                  <m.icon className="h-5 w-5 text-brand-600" />
                  <span className="text-sm font-semibold">{m.label}</span>
                  <span className="text-xs text-muted-foreground">{m.desc}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside>
          <div className="sticky top-24 rounded-xl border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Your order</h2>
            <div className="mt-4 space-y-3">
              {lines.map(({ part, quantity }) => (
                <div key={part.id} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-muted">
                    <Image src={part.image} alt={part.name} fill sizes="48px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{part.name}</p>
                    <p className="text-xs text-muted-foreground">Qty {quantity}</p>
                  </div>
                  <span className="text-sm font-medium">
                    {formatCurrency((part.discountPrice ?? part.price) * quantity)}
                  </span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd>{shipping === 0 ? "Free" : formatCurrency(shipping)}</dd>
              </div>
            </dl>
            <Separator className="my-4" />
            <div className="flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-display text-xl font-bold text-brand-700 dark:text-brand-400">
                {formatCurrency(total)}
              </span>
            </div>
            <Button type="submit" variant="gradient" size="lg" className="mt-5 w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Place order · {formatCurrency(total)}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Secured payment. Your details are protected.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
