import type { UserRole } from "@prisma/client";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { ShellTopbar } from "@/components/shell/shell-topbar";

export interface AppShellProps {
  role: UserRole;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  unreadMessages?: number;
  children: React.ReactNode;
}

/**
 * The signed-in frame: two containers and nothing else.
 *
 * The outer element is pinned to the viewport and never scrolls, so the
 * sidebar stays put no matter how long the page is. Scrolling belongs to the
 * content column alone — which also means the topbar sits above the scroll
 * rather than sliding under it.
 */
export function AppShell({
  role,
  userName = null,
  userEmail = null,
  userImage = null,
  unreadMessages = 0,
  children,
}: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        role={role}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
        unreadMessages={unreadMessages}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ShellTopbar
          role={role}
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
          unreadMessages={unreadMessages}
        />
        <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-7 sm:py-8 lg:px-9">
          {children}
        </main>
      </div>
    </div>
  );
}
