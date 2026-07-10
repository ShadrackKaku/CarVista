import Link from "next/link";
import { Heart, Ship, ShoppingBag, MessageSquare, ArrowRight, Calculator, Car } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { StatCard } from "@/components/dashboard/stat-card";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { ImportTimeline } from "@/components/import/import-timeline";
import { Button } from "@/components/ui/button";
import { SAMPLE_VEHICLES } from "@/lib/sample-data";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const saved = SAMPLE_VEHICLES.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Welcome back, {firstName} 👋</h1>
        <p className="mt-1 text-muted-foreground">Here's what's happening with your account.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saved vehicles" value={saved.length} icon={Heart} />
        <StatCard label="Active imports" value={1} icon={Ship} trend="In transit" />
        <StatCard label="Orders" value={2} icon={ShoppingBag} />
        <StatCard label="Unread messages" value={3} icon={MessageSquare} />
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
          <div className="grid gap-4 sm:grid-cols-2">
            {saved.slice(0, 2).map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        </section>

        {/* Import status */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest import</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/imports">Details</Link>
            </Button>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">2019 Toyota Highlander</p>
                <p className="text-xs text-muted-foreground">Ref: IMP-8K2L-A9F3</p>
              </div>
              <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                In Transit
              </span>
            </div>
            <ImportTimeline currentStage="IN_TRANSIT" />
          </div>
        </section>
      </div>
    </div>
  );
}
