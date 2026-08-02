import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TOOLS } from "@/lib/tools";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Ghana Import Duty & Landed Cost Calculators",
  description:
    "Calculate import duty, landed cost, shipping and financing for a vehicle in Ghana — priced off real ICUMS customs assessments rather than a published rate card.",
  alternates: { canonical: "/calculators" },
};

const WHY = [
  "Priced off real ICUMS assessments, not a published rate card",
  "Every levy shown with the value it is charged on",
  "Includes the 1% examination fee most calculators miss",
  "Repriced at today's exchange rate",
];

/**
 * The public face of the tools. The working calculators live inside the
 * authenticated app; this page keeps the URL, explains what they do and sends
 * visitors to register — so the search traffic this page earns still lands
 * somewhere useful.
 */
export default function PublicCalculatorsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Tools"
        title="Know the real landed cost before you commit"
        description="Most duty calculators ask what you paid. Ghana Customs does not assess on what you paid — it assesses on its own reference value. Ours starts from what GRA actually billed on cars like yours."
      />

      <div className="container-page py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <div>
            <h2 className="font-display text-xl font-bold">What you get</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <div key={tool.id} className="rounded-2xl border p-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-4 flex items-center gap-2 font-semibold">
                      {tool.name}
                      {tool.status === "SOON" && (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Soon
                        </span>
                      )}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {tool.blurb}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="font-semibold">Why ours is different</h2>
              <ul className="mt-4 space-y-3">
                {WHY.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-brand-600 p-6 text-white">
              <h2 className="font-semibold">Free to use</h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-100">
                Create an account to open the calculators, save your quotes and track an import
                end to end.
              </p>
              <Button asChild variant="secondary" className="mt-4 w-full">
                <Link href="/register">
                  Create a free account <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-3 text-center text-xs text-brand-100">
                Already have one?{" "}
                <Link href="/login?callbackUrl=/app/calculators" className="font-semibold underline">
                  Sign in
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
