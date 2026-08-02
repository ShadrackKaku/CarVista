import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { MODULES } from "@/lib/modules";
import { ROLE_PROFILES, APPLICABLE_ROLES } from "@/lib/roles";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Everything CarVista does once you're signed in: a vehicle and parts marketplace, verified dealers and services, and calculators built on real Ghanaian customs assessments.",
  alternates: { canonical: "/features" },
};

/**
 * What the authenticated app contains, described for someone who has not signed
 * in yet.
 *
 * The module list is read from the same registry the application's sidebar is
 * built from, so this page cannot advertise a section that does not exist or
 * quietly omit one that does.
 */
export default function FeaturesPage() {
  // The consoles are shown under "grow your business" instead — a visitor has
  // no use for a dealer console they cannot yet enter.
  const publicModules = MODULES.filter((m) => ["marketplace", "calculators", "garage"].includes(m.id));

  return (
    <div>
      <PageHeader
        eyebrow="What you get"
        title="One place for buying, importing and running a vehicle"
        description="CarVista is a marketplace and an import desk in the same application. Create a free account and everything below is yours."
      />

      <div className="container-page py-12">
        <section className="grid gap-6 lg:grid-cols-3">
          {publicModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div key={mod.id} className="rounded-2xl border bg-card p-6 shadow-soft">
                <Icon className="h-6 w-6 text-brand-600" />
                <h2 className="mt-4 font-display text-xl font-bold">{mod.label}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{mod.blurb}</p>
                <ul className="mt-5 space-y-2">
                  {mod.items
                    .filter((item) => !item.exact && !item.soon)
                    .map((item) => (
                      <li key={item.href} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span>{item.label}</span>
                      </li>
                    ))}
                </ul>
              </div>
            );
          })}
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">The calculators, in detail</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Every estimate is built on the current GRA levy stack and checked against real ICUMS
            assessments shared by importers — not on a rule of thumb.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.href}
                  className="rounded-xl border bg-card p-5 transition-colors hover:border-brand-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Icon className="h-5 w-5 text-brand-600" />
                    {tool.status === "SOON" && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Soon
                      </span>
                    )}
                  </div>
                  <p className="mt-3 font-semibold">{tool.short}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{tool.blurb}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">Grow a business on CarVista</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Everyone signs up as an ordinary user. When you&apos;re ready to trade, apply for the
            role that matches what you do — we review each application before it goes live, which is
            what the verified badge is worth.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {APPLICABLE_ROLES.map((role) => {
              const profile = ROLE_PROFILES[role];
              return (
                <div key={role} className="rounded-xl border bg-card p-5">
                  <p className="font-semibold">{profile.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{profile.blurb}</p>
                  <ul className="mt-4 space-y-1.5">
                    {profile.unlocks.map((u) => (
                      <li key={u} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                        {u}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-16 rounded-2xl border bg-gradient-to-br from-brand-50 to-background p-8 text-center dark:from-brand-900/20">
          <Lock className="mx-auto h-6 w-6 text-brand-600" />
          <h2 className="mt-3 font-display text-2xl font-bold">Free to join, free to list</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Creating an account takes a minute and costs nothing. The full marketplace and every
            calculator open up the moment you&apos;re in.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="gradient" size="lg">
              <Link href="/register">
                Create a free account <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
