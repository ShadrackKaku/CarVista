import type { UserRole } from "@prisma/client";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { ShellTopbar } from "@/components/shell/shell-topbar";

export interface AppShellProps {
  role: UserRole;
  userName?: string | null;
  userImage?: string | null;
  unreadMessages?: number;
  children: React.ReactNode;
}

/**
 * The signed-in frame: one sidebar, one topbar, one content column — shared by
 * the customer garage, the dealer and seller consoles, and the admin console.
 */
export function AppShell({
  role,
  userName = null,
  userImage = null,
  unreadMessages = 0,
  children,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar role={role} unreadMessages={unreadMessages} />
      <div className="flex min-w-0 flex-1 flex-col">
        <ShellTopbar
          role={role}
          userName={userName ?? null}
          userImage={userImage ?? null}
          unreadMessages={unreadMessages}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
