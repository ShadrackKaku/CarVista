import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ListPartForm } from "@/components/parts/list-part-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/seller/products/new");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">List a product</h1>
        <p className="mt-1 text-muted-foreground">
          Add a part to your store. Parts-seller listings go live instantly.
        </p>
      </div>
      <ListPartForm />
    </div>
  );
}
