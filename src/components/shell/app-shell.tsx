import type { UserRole } from "@prisma/client";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { FilterDock } from "@/components/shell/filter-dock";
import { ShellTopbar } from "@/components/shell/shell-topbar";

export interface AppShellProps {
  role: UserRole;
  /** Staff permissions, so the admin nav shows only what they can open. */
  permissions?: string[];
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
 * content column and to each panel's own list — independent scroll regions, so
 * a long filter panel never drags the page or the results beside it.
 *
 * Two fixed columns at most, and only one of them is navigation. The rail is
 * always there; the second column belongs to the current page's filters and
 * appears only where a page has any. The module nav floats out of the rail on
 * hover instead of holding a column of its own — see `AppSidebar`.
 *
 * Both columns decide themselves from the pathname, which is why adding a
 * module or a filtered route touches a registry and nothing here.
 */
export function AppShell({
  role,
  permissions,
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
        permissions={permissions}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
        unreadMessages={unreadMessages}
      />

      {/* Filters for the routes that browse. Renders nothing anywhere else, and
          nothing below `lg`, where the same panel opens in a sheet instead. */}
      <FilterDock />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ShellTopbar
          role={role}
          permissions={permissions}
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
