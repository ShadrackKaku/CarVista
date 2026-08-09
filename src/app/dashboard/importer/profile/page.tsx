import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getImporterForUser } from "@/lib/queries";
import { ImporterProfileForm } from "@/components/import-stock/importer-profile-form";

export const dynamic = "force-dynamic";

export default async function ImporterProfilePage() {
  const user = await getCurrentUser();
  const importer = user ? await getImporterForUser(user.id) : null;
  if (!importer) redirect("/dashboard/importer");

  return (
    <div className="mx-auto max-w-3xl">
      <ImporterProfileForm importer={importer} />
    </div>
  );
}
