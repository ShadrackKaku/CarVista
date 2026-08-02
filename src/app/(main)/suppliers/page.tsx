import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { SupplierDirectory } from "@/components/suppliers/supplier-directory";
import { getSuppliers } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Wholesale Suppliers in Ghana",
  description:
    "Verified wholesale suppliers of vehicles, parts, tyres, lubricants and workshop equipment across Ghana. Request a quote directly.",
  alternates: { canonical: "/suppliers" },
};

export const revalidate = 3600;

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();
  return (
    <div>
      <PageHeader
        eyebrow="Wholesale"
        title="Suppliers"
        description="The businesses dealers and stores buy from. Wholesale pricing depends on quantity and terms, so ask for a quote rather than looking for a price tag."
      />
      <div className="container-page py-10">
        <SupplierDirectory suppliers={suppliers} />
      </div>
    </div>
  );
}
