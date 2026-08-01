import { Receipt } from "lucide-react";
import { getAllOrders } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { OrderRefundButton } from "@/components/admin/order-refund-button";
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

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();
  return (
    <div className="mx-auto max-w-6xl">
      {orders.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
          <Receipt className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No orders yet</p>
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
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Refund</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-accent/40">
                    <td className="px-4 py-3 font-medium">{o.number}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.customer}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(o.date)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.items}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(o.total)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {o.method.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[o.status] ?? "muted"}>{o.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <OrderRefundButton
                        orderId={o.id}
                        refundable={o.refundable}
                        refundStatus={o.refundStatus}
                      />
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
