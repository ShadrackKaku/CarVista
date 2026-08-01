import Link from "next/link";
import { Heart, Ship, ShoppingBag, MessageSquare, ArrowRight, Calculator, Car } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getCustomerStats, getSavedVehicles, getUserImports } from "@/lib/queries";
import { StatCard } from "@/components/dashboard/stat-card";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { ImportTimeline } from "@/components/import/import-timeline";
import { Button } from "@/components/ui/button";
import { IMPORT_STAGES } from "@/lib/constants";

export const dynamic = "force-dynamic";

function stageLabel(stage: string) {
  return IMPORT_STAGES.find((s) => s.value === stage)?.label ?? stage;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const [stats, saved, imports] = user
    ? await Promise.all([
        getCustomerStats(user.id),
        getSavedVehicles(user.id),
        getUserImports(user.id),
      ])
    : [{ saved: 0, imports: 0, orders: 0, unread: 0 }, [], []];

  const latestImport = imports[0];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold">Welcome back, {firstName} 👋</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saved vehicles" value={stats.saved} icon={Heart} />
        <StatCard label="Active imports" value={stats.imports} icon={Ship} />
        <StatCard label="Orders" value={stats.orders} icon={ShoppingBag} />
        <StatCard label="Unread messages" value={stats.unread} icon={MessageSquare} />
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Browse vehicles", href: "/vehicles", icon: Car },
          { label: "Calculate duty", href: "/calculators/import-duty", icon: Calculator },
          { label: "Start an import", href: "/import", icon: Ship },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center justify-between rounded-xl border bg-card p-5 shadow-soft transition-all hover:border-brand-300 hover:shadow-card"
          >
            <span className="flex items-center gap-3 font-medium">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                <action.icon className="h-5 w-5" />
              </span>
              {action.label}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Saved vehicles */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recently saved</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/saved">View all</Link>
            </Button>
          </div>
          {saved.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {saved.slice(0, 2).map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No saved vehicles yet.{" "}
              <Link href="/app/marketplace/vehicles" className="font-medium text-brand-600 hover:underline">
                Browse the marketplace
              </Link>
              .
            </p>
          )}
        </section>

        {/* Import status */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest import</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/imports">Details</Link>
            </Button>
          </div>
          {latestImport ? (
            <div className="rounded-xl border bg-card p-5 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{latestImport.title}</p>
                  <p className="text-xs text-muted-foreground">Ref: {latestImport.ref}</p>
                </div>
                <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  {stageLabel(latestImport.stage)}
                </span>
              </div>
              <ImportTimeline currentStage={latestImport.stage} />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No active imports.{" "}
              <Link href="/import" className="font-medium text-brand-600 hover:underline">
                Start one
              </Link>
              .
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
