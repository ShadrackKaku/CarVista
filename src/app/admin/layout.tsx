import { getUnreadMessageCount } from "@/lib/queries";
import { guardAdminShell } from "@/lib/page-guard";
import { AppShell } from "@/components/shell/app-shell";

/**
 * The front door to the admin console.
 *
 * Admits administrators and any staff member holding at least one permission;
 * each page inside then gates on the specific permission it needs.
 *
 * This used to read `if (user.role !== "ADMIN") redirect("/dashboard")`, which
 * locked SUPER_ADMIN — the *higher* role — out of the console entirely. Nobody
 * hit it because no super admin had ever been created, and it would have gone
 * live the moment one was.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await guardAdminShell();
  const unreadMessages = await getUnreadMessageCount(user.id);

  return (
    <AppShell
      role={user.role}
      permissions={user.permissions}
      userName={user.name}
      userEmail={user.email}
      userImage={user.image}
      unreadMessages={unreadMessages}
    >
      {children}
    </AppShell>
  );
}
