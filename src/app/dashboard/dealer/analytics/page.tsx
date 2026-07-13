import { BarChart3, Car, CircleDollarSign, ShieldCheck, Star } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDealerListings } from "@/lib/queries";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DealerAnalyticsPage() {
  const user = await getCurrentUser();
  const listings = user ? await getDealerListings(user.id) : [];

  const totalValue = listings.reduce((s, v) => s + v.price, 0);
  const avgPrice = listings.length ? totalValue / listings.length : 0;
  const verified = listings.filter((v) => v.verified).length;
  const featured = listings.filter((v) => v.featured).length;

  // Simple breakdown by body type.
  const byBody = listings.reduce<Record<string, number>>((acc, v) => {
    acc[v.bodyType] = (acc[v.bodyType] ?? 0) + 1;
    return acc;
  }, {});
  const maxBody = Math.max(1, ...Object.values(byBody));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-muted-foreground">An overview of your inventory performance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active listings" value={listings.length} icon={Car} />
        <StatCard label="Inventory value" value={formatCompactCurrency(totalValue)} icon={CircleDollarSign} />
        <StatCard label="Average price" value={formatCompactCurrency(avgPrice)} icon={BarChart3} />
        <StatCard label="Verified" value={verified} icon={ShieldCheck} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-4 w-4 text-brand-500" /> Inventory by body type
          </h2>
          {Object.keys(byBody).length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No listings yet.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {Object.entries(byBody)
                .sort((a, b) => b[1] - a[1])
                .map(([body, count]) => (
                  <div key={body}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="capitalize text-muted-foreground">{body.toLowerCase()}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${(count / maxBody) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="flex items-center gap-2 font-semibold">
            <Star className="h-4 w-4 text-brand-500" /> Highlights
          </h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Featured listings</dt>
              <dd className="font-medium">{featured}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Average price</dt>
              <dd className="font-medium">{formatCurrency(avgPrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Total inventory value</dt>
              <dd className="font-medium">{formatCurrency(totalValue)}</dd>
            </div>
          </dl>
          <p className="mt-5 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            Tip: verified and featured listings get significantly more views. Complete your
            verification and feature your best vehicles to sell faster.
          </p>
        </div>
      </div>
    </div>
  );
}
