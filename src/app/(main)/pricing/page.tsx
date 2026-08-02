import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SITE } from "@/lib/constants";
import { whatsappUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "CarVista is free to join, free to browse and free to list. Dealer, supplier and importer accounts are priced on what you trade — talk to us.",
  alternates: { canonical: "/pricing" },
};

/**
 * Plans, in one place.
 *
 * Only the individual tier carries a number, because it is the only one that is
 * actually charged today — nothing in the codebase bills a subscription. The
 * business tiers say "talk to us" rather than showing a figure: publishing a
 * price the platform cannot yet take payment for would be a promise the product
 * can't keep. When the billing model lands, the amounts go here and the CTAs
 * change; the rest of the page needs no edits.
 */
const PLANS = [
  {
    id: "individual",
    name: "Individual",
    price: "Free",
    cadence: "forever",
    for: "Anyone buying, selling or importing their own vehicle.",
    cta: { label: "Create a free account", href: "/register" },
    highlight: false,
    includes: [
      "Browse every vehicle, part, dealer and service",
      "All landed-cost, shipping, financing and tax calculators",
      "Save vehicles and set up search alerts",
      "List your own car — no listing fee",
      "Message sellers and book independent inspections",
      "Track an import end to end",
    ],
    limits: ["One open role application at a time", "No storefront or team accounts"],
  },
  {
    id: "business",
    name: "Dealer & Seller",
    price: "Talk to us",
    cadence: "priced on your stock",
    for: "Dealerships and parts stores trading regularly.",
    cta: { label: "Apply for a dealer account", href: "/register" },
    highlight: true,
    includes: [
      "Everything in Individual",
      "A public storefront buyers can browse and follow",
      "Bulk listing tools and stock management",
      "Leads, enquiries and conversion analytics",
      "The verified badge once your documents check out",
      "Priority placement in search results",
    ],
    limits: ["Verification required before listings go live"],
  },
  {
    id: "trade",
    name: "Supplier & Importer",
    price: "Talk to us",
    cadence: "priced on volume",
    for: "Wholesalers and clearing agents working at volume.",
    cta: { label: "Start a conversation", href: "/contact" },
    highlight: false,
    includes: [
      "Everything in Dealer & Seller",
      "Import requests routed to you",
      "Clearing and shipment tracking tools",
      "Landed-cost quoting on behalf of customers",
      "Wholesale enquiries from verified buyers",
    ],
    limits: ["Business registration required"],
  },
];

export default function PricingPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Pricing"
        title="Free to join. Priced only when you trade."
        description="Buying, importing and running your own car costs nothing on CarVista. We charge businesses that use the platform to sell — and only once it's working for them."
      />

      <div className="container-page py-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-6 shadow-soft",
                plan.highlight && "border-brand-500 ring-2 ring-brand-500/20",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-xl font-bold">{plan.name}</h2>
                {plan.highlight && <Badge variant="brand">Most popular</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{plan.for}</p>

              <div className="mt-5">
                <p className="font-display text-3xl font-bold text-brand-700 dark:text-brand-400">
                  {plan.price}
                </p>
                <p className="text-sm text-muted-foreground">{plan.cadence}</p>
              </div>

              <ul className="mt-6 flex-1 space-y-2">
                {plan.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {plan.limits.length > 0 && (
                <p className="mt-4 border-t pt-4 text-xs text-muted-foreground">
                  {plan.limits.join(" · ")}
                </p>
              )}

              <Button
                asChild
                variant={plan.highlight ? "gradient" : "outline"}
                className="mt-5 w-full"
              >
                <Link href={plan.cta.href}>
                  {plan.cta.label} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>

        <section className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="font-display text-xl font-bold">How accounts actually work</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Everyone registers as an ordinary user — there is no account type to choose at
              sign-up. When you want to trade, you apply for the role that matches what you do and
              we review it. That review is the reason a verified badge on CarVista means something,
              and it is why we can price business accounts on what you actually trade rather than on
              a tier you self-selected.
            </p>
          </div>
          <div className="rounded-2xl border bg-gradient-to-br from-brand-50 to-background p-6 dark:from-brand-900/20">
            <h2 className="font-display text-xl font-bold">Not sure which fits?</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Tell us what you sell and how much of it. We&apos;ll tell you straight whether a paid
              account is worth it yet — plenty of sellers do fine on the free tier.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild className="bg-[#25D366] text-white hover:bg-[#20bd5a]">
                <a
                  href={whatsappUrl(SITE.whatsapp, "Hi CarVista, I'd like to ask about pricing.")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" /> Ask on WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">Contact us</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
