import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { can, canReachAdmin, type Permission } from "@/lib/permissions";

/**
 * Gate an admin *page* on a named permission.
 *
 *   export default async function Page() {
 *     await guardPage("blog:write");
 *     …
 *   }
 *
 * The layout decides who may enter the console at all; this decides who may
 * open each page inside it. Both are needed: a staff member holding only
 * `blog:write` passes the layout and must still be turned away from escrow.
 *
 * Sends them to the console root rather than showing a bare 403, because from
 * their side there is nothing to fix — they simply do not do that job.
 */
export async function guardPage(permission: Permission) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin");
  if (!can(user, permission)) redirect("/admin");
  return user;
}

/** Gate on being able to reach the console at all, without naming a page. */
export async function guardAdminShell() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin");
  if (!canReachAdmin(user)) redirect("/dashboard");
  return user;
}
