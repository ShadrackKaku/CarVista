import Link from "next/link";
import { BarChart3, Car, Eye, MessageSquare, TrendingUp } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDealerInventory, getDealerStats } from "@/lib/queries";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCompactCurrency, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DealerAnalyticsPage() {
  const user = await getCurrentUser();
  const [listings, stats] = user
    ? await Promise.all([getDealerInventory(user.id), getDealerStats(user.id)])
    : [[], null];

  // Breakdown by body type.
  const byBody = listings.reduce<Record<string, number>>((acc, v) => {
    acc[v.bodyType] = (acc[v.bodyType] ?? 0) + 1;
    return acc;
  }, {});
  const maxBody = Math.max(1, ...Object.values(byBody));

  // Most-viewed listings.
  const topViewed = [...listings].sort((a, b) => b.views - a.views).slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active listings" value={stats?.active ?? 0} icon={Car} />
        <StatCard label="Total views" value={formatNumber(stats?.totalViews ?? 0)} icon={Eye} />
        <StatCard label="Avg views / listing" value={formatNumber(stats?.avgViews ?? 0)} icon={TrendingUp} />
        <StatCard label="Leads" value={formatNumber(stats?.leads ?? 0)} icon={MessageSquare} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="flex items-center gap-2 font-semibold">
            <Eye className="h-4 w-4 text-brand-500" /> Most-viewed listings
          </h2>
          {topViewed.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No listings yet.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {topViewed.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 text-sm">
                  <Link
                    href={`/vehicles/${v.slug}`}
                    className="min-w-0 truncate font-medium hover:text-brand-600"
                  >
                    {v.title}
                  </Link>
                  <span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" /> {formatNumber(v.views)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

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
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="font-semibold">Highlights</h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3 text-sm">
          <Highlight label="Inventory value" value={formatCompactCurrency(stats?.inventoryValue ?? 0)} />
          <Highlight label="Sold" value={formatNumber(stats?.sold ?? 0)} />
          <Highlight label="Verified" value={formatNumber(stats?.verified ?? 0)} />
        </dl>
        <p className="mt-5 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          Tip: verified and featured listings get significantly more views. Complete verification and
          feature your best vehicles to sell faster.
        </p>
      </div>
    </div>
  );
}

function Highlight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background/60 p-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-display text-xl font-bold">{value}</dd>
    </div>
  );
}
