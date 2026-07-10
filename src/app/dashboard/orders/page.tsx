import Link from "next/link";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

const orders = [
  {
    number: "CV-4H2K-9AF3",
    date: "2025-01-12",
    status: "SHIPPED",
    items: 3,
    total: 1720,
  },
  {
    number: "CV-2J8L-7BC1",
    date: "2025-01-05",
    status: "DELIVERED",
    items: 1,
    total: 950,
  },
];

const statusVariant: Record<string, "success" | "brand" | "warning" | "muted"> = {
  DELIVERED: "success",
  SHIPPED: "brand",
  PROCESSING: "warning",
  PENDING: "muted",
};

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-bold">My Orders</h1>
      <p className="mt-1 text-muted-foreground">Your parts orders and their status.</p>

      {orders.length > 0 ? (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <div
              key={order.number}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5 shadow-soft"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                  <Package className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">{order.number}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.date)} · {order.items} item{order.items > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
                <span className="font-semibold">{formatCurrency(order.total)}</span>
                <Button variant="outline" size="sm">
                  Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">You have no orders yet.</p>
          <Button asChild variant="gradient" className="mt-4">
            <Link href="/parts">Shop parts</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
