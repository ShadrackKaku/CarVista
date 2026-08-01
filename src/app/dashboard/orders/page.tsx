import Link from "next/link";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";
import { getUserOrders } from "@/lib/queries";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusVariant: Record<string, "success" | "brand" | "warning" | "muted" | "destructive"> = {
  DELIVERED: "success",
  SHIPPED: "brand",
  PROCESSING: "warning",
  PAID: "brand",
  PENDING: "muted",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

export default async function OrdersPage() {
  const user = await getCurrentUser();
  const orders = user ? await getUserOrders(user.id) : [];

  return (
    <div className="mx-auto max-w-5xl">
      {orders.length > 0 ? (
        <div className="space-y-4">
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
                <Badge variant={statusVariant[order.status] ?? "muted"}>{order.status}</Badge>
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
            <Link href="/app/marketplace/parts">Shop parts</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
