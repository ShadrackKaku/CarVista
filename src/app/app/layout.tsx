import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getUnreadMessageCount } from "@/lib/queries";
import { AppShell } from "@/components/shell/app-shell";

/**
 * The authenticated application.
 *
 * Everything under /app renders inside the shell — marketplace, calculators,
 * listings, tools. Nothing here breaks out into a standalone page, and the
 * shell persists across every navigation within it.
 *
 * Middleware already blocks unauthenticated requests and carries the requested
 * destination through login. This second check is not redundant: it is the
 * server-side guard, so a route is protected even if middleware matching is
 * ever changed or bypassed.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/app");

  const unreadMessages = await getUnreadMessageCount(user.id);

  return (
    <AppShell
      role={user.role}
      userName={user.name}
      userEmail={user.email}
      userImage={user.image}
      unreadMessages={unreadMessages}
    >
      {children}
    </AppShell>
  );
}
