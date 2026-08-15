import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { safeJsonLd } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: `Answers to common questions about buying, importing, and selling vehicles and parts on ${SITE.name}.`,
  alternates: { canonical: "/faq" },
};

const faqGroups = [
  {
    category: "Buying a car",
    items: [
      {
        q: "How do I know a dealer is trustworthy?",
        a: "Look for the Verified badge on dealer profiles. Verified dealers have had their business documents and physical location confirmed by our team. You can also read genuine customer reviews on every dealer's page.",
      },
      {
        q: "Can I inspect a vehicle before buying?",
        a: "Absolutely. We always recommend inspecting a vehicle in person or booking one of our independent inspection services before making any payment. Never pay in full before seeing the car.",
      },
      {
        q: "Is financing available?",
        a: "Yes. Use our financing calculator to estimate monthly payments, then connect with our partner banks and credit unions for pre-approval.",
      },
    ],
  },
  {
    category: "Importing a vehicle",
    items: [
      {
        q: "How accurate is the import duty calculator?",
        a: "Our calculator uses current GRA duty rates, VAT, NHIL, GETFund and port charges to give a close estimate. Final assessment is done by GRA Customs via the ICUMS platform based on the Home Delivery Value (HDV), so the final figure may differ slightly.",
      },
      {
        q: "Which countries can I import from?",
        a: "We source from the United States, United Kingdom, Germany, Japan, Canada, South Korea and the UAE through major auctions like Copart, IAAI, Manheim and BE FORWARD.",
      },
      {
        q: "How long does importing take?",
        a: "Typically 4–8 weeks depending on the origin and shipping method. RoRo is faster and cheaper; container shipping offers more protection. You can track every stage in your dashboard.",
      },
      {
        q: "What is the over-age penalty?",
        a: "Vehicles older than 10 years attract an additional penalty on top of standard duties. Our calculator automatically applies this based on the manufacture year you enter.",
      },
    ],
  },
  {
    category: "Parts & orders",
    items: [
      {
        q: "How do I find the right part for my car?",
        a: "Use our fitment search: select your vehicle make, category, and optionally enter the OEM or part number. We'll only show parts compatible with your vehicle.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept Mobile Money (MTN, Telecel, AirtelTigo), card payments via Paystack, and bank transfers. Cash on delivery is available in select areas.",
      },
      {
        q: "What is your return policy?",
        a: "Most parts can be returned within 7 days if unused and in original packaging. Some electrical and special-order items are non-returnable — this is noted on the product page.",
      },
    ],
  },
  {
    category: "Selling",
    items: [
      {
        q: "How do I list my car or parts?",
        a: "Create a free account, choose your role (dealer, parts seller or private seller), and use your dashboard to add listings with photos and videos. Dealer listings go live instantly; private listings are reviewed first.",
      },
      {
        q: "How do I become a verified dealer?",
        a: "Register as a dealer, complete your business profile, and submit your business registration documents. Our team reviews and verifies within 2–3 business days.",
      },
    ],
  },
];

export default function FAQPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqGroups.flatMap((g) =>
      g.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    ),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <PageHeader
        eyebrow="Help Center"
        title="Frequently Asked Questions"
        description={`Everything you need to know about buying, importing, selling and servicing on ${SITE.name}.`}
      />
      <div className="container-page py-12">
        <div className="mx-auto max-w-3xl space-y-10">
          {faqGroups.map((group) => (
            <div key={group.category}>
              <h2 className="mb-2 font-display text-xl font-bold">{group.category}</h2>
              <Accordion type="single" collapsible className="w-full">
                {group.items.map((item, i) => (
                  <AccordionItem key={i} value={`${group.category}-${i}`}>
                    <AccordionTrigger>{item.q}</AccordionTrigger>
                    <AccordionContent>{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border bg-card p-8 text-center">
          <h3 className="font-display text-xl font-bold">Still have questions?</h3>
          <p className="mt-2 text-muted-foreground">Our team is here to help.</p>
          <Link
            href="/contact"
            className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
