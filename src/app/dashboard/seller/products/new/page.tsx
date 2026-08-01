import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ListPartForm } from "@/components/parts/list-part-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/seller/products/new");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ListPartForm />
    </div>
  );
}
