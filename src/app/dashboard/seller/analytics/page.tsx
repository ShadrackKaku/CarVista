import { BarChart3, Boxes, CircleDollarSign, PackageCheck, ShoppingCart } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getSellerProducts, getSellerOrders } from "@/lib/queries";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerAnalyticsPage() {
  const user = await getCurrentUser();
  const [products, orders] = user
    ? await Promise.all([getSellerProducts(user.id), getSellerOrders(user.id)])
    : [[], []];

  const inventoryValue = products.reduce((s, p) => s + (p.discountPrice ?? p.price) * p.stock, 0);
  const revenue = orders
    .filter((o) => ["PAID", "SHIPPED", "DELIVERED"].includes(o.status))
    .reduce((s, o) => s + o.total, 0);
  const inStock = products.filter((p) => p.stock > 0).length;

  const byCategory = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
  const maxCat = Math.max(1, ...Object.values(byCategory));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-muted-foreground">How your store is performing.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Products" value={products.length} icon={Boxes} />
        <StatCard label="In stock" value={inStock} icon={PackageCheck} />
        <StatCard label="Orders" value={orders.length} icon={ShoppingCart} />
        <StatCard label="Revenue" value={formatCompactCurrency(revenue)} icon={CircleDollarSign} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-4 w-4 text-brand-500" /> Products by category
          </h2>
          {Object.keys(byCategory).length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No products yet.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {Object.entries(byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => (
                  <div key={cat}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-muted-foreground">{cat}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${(count / maxCat) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="font-semibold">Summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Inventory value</dt>
              <dd className="font-medium">{formatCurrency(inventoryValue)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Paid revenue</dt>
              <dd className="font-medium">{formatCurrency(revenue)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Total orders</dt>
              <dd className="font-medium">{orders.length}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
