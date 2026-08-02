import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getUserImports } from "@/lib/queries";

/**
 * The module's entry point, not a page of its own.
 *
 * Someone with imports in flight wants to see them; someone with none wants to
 * start one. Sending both to the same overview would make one of them click
 * again, so this picks.
 */
export default async function ImportsIndexPage() {
  const user = await getCurrentUser();
  const imports = user ? await getUserImports(user.id).catch(() => []) : [];
  redirect(imports.length > 0 ? "/app/imports/mine" : "/app/imports/new");
}
