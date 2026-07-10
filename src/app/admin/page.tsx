import Link from "next/link";
import {
  Car,
  DollarSign,
  Package,
  Ship,
  Store,
  Users,
  ArrowRight,
  FileText,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

const recentActivity = [
  { type: "New dealer", detail: "Spintex Car Centre applied for verification", time: "2h ago" },
  { type: "New order", detail: "CV-4H2K-9AF3 · GHS 1,720", time: "3h ago" },
  { type: "Import request", detail: "IMP-8K2L · 2019 Toyota Highlander", time: "5h ago" },
  { type: "New listing", detail: "2022 Hyundai Elantra pending review", time: "6h ago" },
  { type: "Review flagged", detail: "Report on West Coast Autos", time: "1d ago" },
];

export default function AdminOverviewPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Admin Overview</h1>
        <p className="mt-1 text-muted-foreground">Platform-wide metrics and activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value="28,412" icon={Users} trend="+312 this week" />
        <StatCard label="Active listings" value="12,408" icon={Car} />
        <StatCard label="Verified dealers" value="342" icon={Store} />
        <StatCard label="Parts listed" value="9,120" icon={Package} />
        <StatCard label="Imports in progress" value="187" icon={Ship} />
        <StatCard label="Revenue (MTD)" value={formatCurrency(1284000)} icon={DollarSign} trend="+18% MoM" />
        <StatCard label="Pending reviews" value="24" icon={FileText} />
        <StatCard label="Open reports" value="6" icon={FileText} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <h2 className="mb-4 text-lg font-semibold">Recent activity</h2>
          <div className="divide-y overflow-hidden rounded-2xl border bg-card shadow-soft">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div>
                  <Badge variant="muted" className="mb-1">{a.type}</Badge>
                  <p className="text-sm">{a.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground">{a.time}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Quick actions</h2>
          <div className="space-y-3">
            {[
              { label: "Manage duty rates", href: "/admin/duty-rates", icon: FileText },
              { label: "Review pending listings", href: "/admin/vehicles", icon: Car },
              { label: "Verify dealers", href: "/admin/dealers", icon: Store },
              { label: "Manage users", href: "/admin/users", icon: Users },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center justify-between rounded-xl border bg-card p-4 shadow-soft transition-all hover:border-brand-300"
              >
                <span className="flex items-center gap-3 text-sm font-medium">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                    <action.icon className="h-4 w-4" />
                  </span>
                  {action.label}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
