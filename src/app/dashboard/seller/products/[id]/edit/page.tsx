import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getPartForEdit } from "@/lib/queries";
import { ListPartForm } from "@/components/parts/list-part-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=/dashboard/seller/products/${params.id}/edit`);

  const part = await getPartForEdit(params.id);
  // Only the seller who owns it (or an admin) may edit.
  if (!part) notFound();
  if (part.sellerId !== user.id && user.role !== "ADMIN") notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ListPartForm
        partId={part.id}
        initial={{
          name: part.name,
          categorySlug: part.categorySlug,
          brand: part.brand,
          oemNumber: part.oemNumber,
          partNumber: part.partNumber,
          condition: part.condition,
          price: part.price,
          discountPrice: part.discountPrice,
          stock: part.stock,
          sku: part.sku,
          compatibleMakes: part.compatibleMakes,
          compatibleModels: part.compatibleModels,
          yearFrom: part.yearFrom,
          yearTo: part.yearTo,
          fitmentPosition: part.fitmentPosition,
          description: part.description,
          images: part.images,
        }}
      />
    </div>
  );
}
