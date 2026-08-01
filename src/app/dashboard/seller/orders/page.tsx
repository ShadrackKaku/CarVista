import { Receipt } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getSellerOrders } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
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

export default async function SellerOrdersPage() {
  const user = await getCurrentUser();
  const orders = user ? await getSellerOrders(user.id) : [];

  return (
    <div className="mx-auto max-w-5xl">
      {orders.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
          <Receipt className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No orders yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            When customers buy your products, their orders appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Your total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => (
                  <tr key={o.number} className="hover:bg-accent/40">
                    <td className="px-4 py-3 font-medium">{o.number}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.customer}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(o.date)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.items}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(o.total)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[o.status] ?? "muted"}>{o.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
