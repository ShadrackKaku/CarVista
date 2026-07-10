import Link from "next/link";
import Image from "next/image";
import { Car, Eye, MessageSquare, Plus, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_VEHICLES } from "@/lib/sample-data";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function DealerDashboardPage() {
  const listings = SAMPLE_VEHICLES.slice(0, 5);
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
        <StatCard label="Active listings" value={68} icon={Car} />
        <StatCard label="Total views" value="12.4K" icon={Eye} trend="+8% this week" />
        <StatCard label="Inquiries" value={34} icon={MessageSquare} trend="+12 new" />
        <StatCard label="Sales this month" value={formatCurrency(2450000)} icon={TrendingUp} />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent listings</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/dealer/listings">Manage all</Link>
          </Button>
        </div>
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Views</th>
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
                    <td className="px-4 py-3 text-muted-foreground">{formatNumber(1200 + v.year)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="success">Active</Badge>
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
      </section>
    </div>
  );
}
