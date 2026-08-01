import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getUnreadMessageCount } from "@/lib/queries";
import { AppShell } from "@/components/shell/app-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard");

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
