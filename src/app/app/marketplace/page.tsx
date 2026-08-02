import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDealers, getParts, getServices, getVehicles } from "@/lib/queries";
import { MODULES, moduleItemsFor } from "@/lib/modules";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Marketplace" };
export const dynamic = "force-dynamic";

/**
 * Module overview: what's on the platform right now, and a way into each part
 * of it. The counts come from the same queries the sections themselves use, so
 * this can never advertise stock that isn't there.
 */
export default async function MarketplaceOverviewPage() {
  const [user, vehicles, parts, dealers, services] = await Promise.all([
    getCurrentUser().catch(() => null),
    getVehicles().catch(() => []),
    getParts().catch(() => []),
    getDealers().catch(() => []),
    getServices().catch(() => []),
  ]);

  const counts: Record<string, number> = {
    "/app/marketplace/vehicles": vehicles.length,
    "/app/marketplace/parts": parts.length,
    "/app/marketplace/dealers": dealers.length,
    "/app/marketplace/services": services.length,
  };

  const marketplace = MODULES.find((m) => m.id === "marketplace")!;
  const sections = moduleItemsFor(marketplace, user?.role ?? null).filter((i) => !i.exact);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Vehicles listed", value: vehicles.length },
          { label: "Parts listed", value: parts.length },
          { label: "Verified dealers", value: dealers.filter((d) => d.verified).length },
          { label: "Service providers", value: services.length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-display text-lg font-bold">Browse the marketplace</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;
            const count = counts[section.href];
            return (
              <Link
                key={section.href}
                href={section.href}
                className="flex flex-col rounded-2xl border p-5 transition-all hover:border-brand-300 hover:shadow-lift"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mt-4 flex items-baseline gap-2">
                  <span className="font-semibold">{section.label}</span>
                  {count != null && (
                    <span className="text-sm tabular-nums text-muted-foreground">{count}</span>
                  )}
                </span>
                <span className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand-600">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
