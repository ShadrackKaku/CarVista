import type { Metadata } from "next";
import { SupplierProfile } from "@/components/suppliers/supplier-profile";
import { getSupplierBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supplier = await getSupplierBySlug(params.slug);
  return { title: supplier?.name ?? "Supplier" };
}

export default function AppSupplierPage({ params }: { params: { slug: string } }) {
  return <SupplierProfile slug={params.slug} inShell />;
}
