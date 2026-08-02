import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { DealerCard } from "@/components/dealers/dealer-card";
import { getDealers } from "@/lib/queries";

export const metadata: Metadata = { title: "Dealers" };
export const dynamic = "force-dynamic";

export default async function AppDealersPage() {
  const dealers = await getDealers();
  return (
    <div>
      <div className="mb-6 flex items-center gap-2 rounded-xl border bg-brand-50/50 p-4 text-sm dark:bg-brand-900/10">
        <ShieldCheck className="h-5 w-5 shrink-0 text-brand-600" />
        <span className="text-muted-foreground">
          Look for the <span className="font-semibold text-foreground">Verified</span> badge — it
          means the dealer&apos;s business documents and location have been confirmed by CarVista.
        </span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {dealers.map((dealer) => (
          <DealerCard key={dealer.id} dealer={dealer} basePath="/app/marketplace/dealers" />
        ))}
      </div>
    </div>
  );
}
