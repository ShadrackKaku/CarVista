import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DealerCard } from "@/components/dealers/dealer-card";
import { getDealers } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Verified Car Dealers in Ghana",
  description:
    "Browse CarVista's directory of verified car dealers across Ghana. Read reviews, view inventory and buy with confidence.",
  alternates: { canonical: "/dealers" },
};

export const dynamic = "force-dynamic";

export default async function DealersPage() {
  const dealers = await getDealers();
  return (
    <div>
      <PageHeader
        eyebrow="Dealer Directory"
        title="Verified Car Dealers"
        description="Every dealer on CarVista is vetted and badged. Browse inventory, read reviews and connect directly."
      />
      <div className="container-page py-10">
        <div className="mb-6 flex items-center gap-2 rounded-xl border bg-brand-50/50 p-4 text-sm dark:bg-brand-900/10">
          <ShieldCheck className="h-5 w-5 text-brand-600" />
          <span className="text-muted-foreground">
            Look for the <span className="font-semibold text-foreground">Verified</span> badge — it
            means the dealer's business documents and location have been confirmed by CarVista.
          </span>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {dealers.map((dealer) => (
            <DealerCard key={dealer.id} dealer={dealer} />
          ))}
        </div>
      </div>
    </div>
  );
}
