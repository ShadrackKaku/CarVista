import type { Metadata } from "next";
import { SupplierProfile } from "@/components/suppliers/supplier-profile";
import { getSupplierBySlug } from "@/lib/queries";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supplier = await getSupplierBySlug(params.slug);
  if (!supplier) return { title: "Supplier not found" };
  const title = `${supplier.name} — Wholesale Supplier${supplier.city ? ` in ${supplier.city}` : ""}`;
  return {
    title,
    description:
      supplier.description ||
      `${supplier.name} supplies ${supplier.categories.join(", ").toLowerCase() || "automotive goods"} wholesale in Ghana.`,
    alternates: { canonical: `/suppliers/${supplier.slug}` },
  };
}

/** The public, indexable profile. Signed-in users get the same view in-shell. */
export default function SupplierPage({ params }: { params: { slug: string } }) {
  return <SupplierProfile slug={params.slug} />;
}
