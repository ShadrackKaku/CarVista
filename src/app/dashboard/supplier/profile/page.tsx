import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getSupplierForUser } from "@/lib/queries";
import { SupplierProfileForm } from "@/components/suppliers/supplier-profile-form";

export const dynamic = "force-dynamic";

export default async function SupplierProfilePage() {
  const user = await getCurrentUser();
  const supplier = user ? await getSupplierForUser(user.id) : null;
  if (!supplier) redirect("/dashboard/supplier");

  return (
    <div className="mx-auto max-w-3xl">
      <SupplierProfileForm supplier={supplier} />
    </div>
  );
}
