import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  FileSearch,
  Globe,
  Search,
  ShieldCheck,
  Ship,
  Truck,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { IMPORT_STAGES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Import a Car to Ghana — End-to-End Vehicle Import Service",
  description:
    "Import any vehicle to Ghana with CarVista. We source from US, UK, German, Japanese and Dubai auctions, ship, clear customs at Tema or Takoradi, and deliver to your door.",
  alternates: { canonical: "/import" },
};

/**
 * The public face of the import service.
 *
 * The request form used to live at this URL, which meant a signed-out visitor
 * met a form before they knew what they were buying, and a signed-in one filled
 * it in on the marketing site with the app's navigation nowhere in sight. The
 * form moved into the Imports module; this page does the job the URL was
 * actually being asked to do — explain the service and convert.
 */
const STEPS = [
  {
    icon: Search,
    title: "Tell us what you want",
    desc: "Make, model, year, budget. We search auctions in the US, UK, Germany, Japan and Dubai.",
  },
  {
    icon: Calculator,
    title: "Get the full landed cost",
    desc: "CIF, duty, every GRA levy, shipping and clearing — one number, before you commit to anything.",
  },
  {
    icon: Ship,
    title: "We buy and ship",
    desc: "Once you approve the quote we purchase at auction and ship to Tema or Takoradi.",
  },
  {
    icon: ShieldCheck,
    title: "We clear customs",
    desc: "Our licensed agents handle GRA clearance end to end, with the paperwork in your account.",
  },
  {
    icon: Truck,
    title: "Delivered to you",
    desc: "We deliver to your location, ready to register. You've known the cost since step two.",
  },
];

const WHY = [
  {
    icon: Calculator,
    title: "The number you're quoted is the number you pay",
    body: "Our landed-cost estimates are calibrated against real ICUMS assessments importers have shared with us — not a rule of thumb, and not a percentage someone guessed. You can check the arithmetic line by line before you say yes.",
  },
  {
    icon: Globe,
    title: "Five auction markets, one process",
    body: "Different markets suit different cars. We source from whichever gives you the best vehicle for your budget, and the process on your side is identical either way.",
  },
  {
    icon: ShieldCheck,
    title: "Your money sits in escrow",
    body: "Funds are held until the milestone they're for is met. If something goes wrong before your car ships, the money is still yours.",
  },
  {
    icon: FileSearch,
    title: "You can see where your car is",
    body: "Every stage — purchased, loaded, sailing, berthed, cleared, delivered — is timestamped in your account, with the documents attached.",
  },
];

export default function ImportPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Vehicle Import"
        title="Import any car to Ghana — without the guesswork"
        description="From US, UK, German, Japanese and Dubai auctions to your doorstep. We source, ship, clear and deliver — and you know the landed cost before a single cedi moves."
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="gradient" size="lg">
            <Link href="/register">
              Start an import <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/calculators">
              <Calculator className="h-4 w-4" /> Price one first
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="container-page py-12">
        <section>
          <h2 className="font-display text-2xl font-bold">How it works</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((step, i) => (
              <div key={step.title} className="rounded-2xl border bg-card p-5 shadow-soft">
                <div className="flex items-center gap-2">
                  <step.icon className="h-5 w-5 text-brand-600" />
                  <span className="text-xs font-semibold text-muted-foreground">
                    Step {i + 1}
                  </span>
                </div>
                <p className="mt-3 font-semibold leading-tight">{step.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 sm:grid-cols-2">
          {WHY.map((item) => (
            <div key={item.title} className="rounded-2xl border bg-card p-6">
              <item.icon className="h-6 w-6 text-brand-600" />
              <h2 className="mt-4 font-display text-lg font-bold">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">What you'll see, stage by stage</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Every import in your account moves through these. You get a notification at each one,
            and the documents land in the same place.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {IMPORT_STAGES.map((stage) => (
              <span
                key={stage.value}
                className="flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-2 text-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                {stage.label}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl border bg-gradient-to-br from-brand-50 to-background p-8 text-center dark:from-brand-900/20">
          <Ship className="mx-auto h-6 w-6 text-brand-600" />
          <h2 className="mt-3 font-display text-2xl font-bold">Ready when you are</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Create a free account and start an import request. There's no obligation until you
            approve a quote — and the quote comes with the arithmetic attached.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="gradient" size="lg">
              <Link href="/register">
                Create a free account <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">Talk to us first</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
