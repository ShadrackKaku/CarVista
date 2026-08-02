import type { Metadata } from "next";
import { SupplierDirectory } from "@/components/suppliers/supplier-directory";
import { getSuppliers } from "@/lib/queries";

export const metadata: Metadata = { title: "Suppliers" };
export const dynamic = "force-dynamic";

export default async function AppSuppliersPage() {
  const suppliers = await getSuppliers();
  return <SupplierDirectory suppliers={suppliers} basePath="/app/marketplace/suppliers" />;
}
