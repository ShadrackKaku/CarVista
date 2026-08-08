import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { DealerDirectory } from "@/components/dealers/dealer-directory";
import { getDealers } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Verified Car Dealers in Ghana",
  description:
    "Browse CarVista's directory of verified car dealers across Ghana. Read reviews, view inventory and buy with confidence.",
  alternates: { canonical: "/dealers" },
};

export const revalidate = 60;

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
        <DealerDirectory dealers={dealers} />
      </div>
    </div>
  );
}
