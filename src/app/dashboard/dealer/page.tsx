import Link from "next/link";
import Image from "next/image";
import { Car, CircleDollarSign, Eye, MessageSquare, Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDealerListings, getDealerStats } from "@/lib/queries";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatCompactCurrency, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DealerDashboardPage() {
  const user = await getCurrentUser();
  const [listings, stats] = user
    ? await Promise.all([getDealerListings(user.id), getDealerStats(user.id)])
    : [[], null];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Dealer Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Manage your inventory and track performance.</p>
        </div>
        <Button asChild variant="gradient">
          <Link href="/vehicles/new">
            <Plus className="h-4 w-4" /> Add vehicle
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active listings" value={stats?.active ?? listings.length} icon={Car} />
        <StatCard label="Total views" value={formatNumber(stats?.totalViews ?? 0)} icon={Eye} />
        <StatCard label="Leads" value={formatNumber(stats?.leads ?? 0)} icon={MessageSquare} />
        <StatCard
          label="Inventory value"
          value={formatCompactCurrency(stats?.inventoryValue ?? 0)}
          icon={CircleDollarSign}
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">My listings</h2>
        </div>
        {listings.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
            <Car className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">No listings yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add your first vehicle to start selling.</p>
            <Button asChild variant="gradient" className="mt-5">
              <Link href="/vehicles/new">
                <Plus className="h-4 w-4" /> Add vehicle
              </Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Vehicle</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Year</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {listings.map((v) => (
                    <tr key={v.id} className="hover:bg-accent/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-16 overflow-hidden rounded-lg bg-muted">
                            <Image src={v.images[0]} alt={v.title} fill sizes="64px" className="object-cover" />
                          </div>
                          <span className="font-medium">{v.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(v.price)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{v.year}</td>
                      <td className="px-4 py-3">
                        <Badge variant={v.verified ? "success" : "warning"}>
                          {v.verified ? "Verified" : "Pending"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
