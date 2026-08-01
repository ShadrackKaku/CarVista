import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getUnreadMessageCount } from "@/lib/queries";
import { AppShell } from "@/components/shell/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const unreadMessages = await getUnreadMessageCount(user.id);

  return (
    <AppShell
      role="ADMIN"
      userName={user.name}
      userImage={user.image}
      unreadMessages={unreadMessages}
    >
      {children}
    </AppShell>
  );
}
