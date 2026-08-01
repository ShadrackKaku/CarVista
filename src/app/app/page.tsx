import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { homeHrefFor } from "@/lib/navigation";

/** /app is an entry point, not a page — send each role where they work. */
export default async function AppIndexPage() {
  const user = await getCurrentUser();
  redirect(homeHrefFor(user?.role ?? null));
}
