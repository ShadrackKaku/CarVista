import type { UserRole } from "@prisma/client";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { ModuleSidebar } from "@/components/shell/module-sidebar";
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
 * The signed-in frame. Everything a user can do after login renders inside it;
 * nothing breaks out into a standalone page.
 *
 * The outer element is pinned to the viewport and never scrolls, so the
 * sidebars stay put no matter how long the page is. Scrolling belongs to the
 * content column and to each sidebar's own nav list — three independent scroll
 * regions, so a long module nav never drags the page or the content with it.
 *
 * The module column appears only when the current route belongs to a module;
 * `ModuleSidebar` decides that from the pathname, which is why adding a module
 * touches the registry and nothing here.
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

      {/* Module navigation — hidden on small screens, where it folds into the
          topbar drawer alongside the main nav. */}
      <div className="hidden lg:block">
        <ModuleSidebar role={role} />
      </div>

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
