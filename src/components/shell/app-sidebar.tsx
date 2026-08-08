"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, MessageSquare, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { Logo } from "@/components/logo";
import { ModuleSidebar } from "@/components/shell/module-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import { moduleForPath, modulesFor, usesRail, type AppModule } from "@/lib/modules";
import { openCommandPalette } from "@/lib/ui-events";

const COLLAPSE_KEY = "carvista:sidebar-collapsed";

export interface AppSidebarProps {
  role: UserRole;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  unreadMessages?: number;
  /** Rendered inside a mobile drawer: always expanded, no collapse control. */
  variant?: "fixed" | "drawer";
  onNavigate?: () => void;
}

/**
 * The main sidebar: one row per module, and nothing else.
 *
 * It used to list every destination in the app, grouped into collapsible
 * sections. That does not survive contact with a real account — an admin has
 * roughly thirty entries, so the list scrolled, and the sections that mattered
 * most (their own garage, the admin console) sat below eight calculator links
 * and a promo card. You had to scroll a navigation panel to find navigation.
 *
 * Now the leaves live in each module's own sidebar, which is where the user
 * already is when they need them, and this panel answers one question: which
 * part of the app am I in? Six rows at most, so it never scrolls, nothing folds,
 * and the collapsed rail is legible because each icon stands for a place rather
 * than for one link among thirty.
 *
 * That module sidebar is no longer a column of its own. Hovering a row here
 * floats it out over the content instead, which buys back roughly 16rem of
 * width and — more to the point — hands the fixed column beside the rail to the
 * filter panel, the one thing on a browse page you operate *while* reading the
 * results rather than on the way to them.
 *
 * Peeking is per-row, not per-page: hover Imports while you are in Marketplace
 * and you get the Imports nav, so the rail is a switcher you can read before
 * committing to, rather than a set of eight one-way doors.
 */
export function AppSidebar({
  role,
  userName,
  userEmail,
  userImage,
  unreadMessages = 0,
  variant = "fixed",
  onNavigate,
}: AppSidebarProps) {
  const pathname = usePathname();
  const modules = modulesFor(role);
  const current = moduleForPath(pathname);
  const isDrawer = variant === "drawer";
  const [collapsed, setCollapsed] = useState(false);

  // Read the stored preference after mount so the server and the first client
  // render agree; otherwise the sidebar snaps width on hydration.
  useEffect(() => {
    if (isDrawer) return;
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
  }, [isDrawer]);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  // Inside a module the panel folds to its rail so the module's own navigation
  // can take the space (§10). It is never removed — every other module stays
  // one click away — and the user's own collapse preference is left untouched
  // for when they leave.
  // `usesRail` rather than `current !== null`: search folds the sidebar too,
  // without claiming a module it does not belong to.
  const folded = usesRail(pathname);
  const isCollapsed = !isDrawer && (collapsed || folded);

  // The module whose nav is currently floating out. Null is closed.
  const [peek, setPeek] = useState<AppModule | null>(null);
  const closePeek = useCallback(() => setPeek(null), []);

  // Withdraw on navigation: the flyout has done its job the moment the route
  // changes, and leaving it up would cover the page it just opened.
  useEffect(() => {
    setPeek(null);
  }, [pathname]);

  // Escape listens on the document, not on the panel. The flyout is usually
  // opened by hover, which leaves focus on `<body>` — a handler bound to the
  // sidebar would never receive the key that is supposed to dismiss it.
  useEffect(() => {
    if (!peek) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPeek(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [peek]);

  const rail = (
    <aside
      className={cn(
        // The brand panel. Deep periwinkle in both themes — it is a branded
        // surface, not a themed one.
        "flex h-full flex-col bg-brand-900 text-white",
        isDrawer ? "w-full" : "shrink-0 transition-[width] duration-200",
        !isDrawer && (isCollapsed ? "w-[5.5rem]" : "w-[17rem]"),
      )}
    >
      {/* Brand + collapse */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center",
          isCollapsed ? "justify-center px-2" : "justify-between pl-5 pr-3",
        )}
      >
        <Logo withText={!isCollapsed} className="text-white [&_.text-gradient]:text-brand-300" />
        {!isDrawer && !isCollapsed && (
          <button
            type="button"
            onClick={toggle}
            aria-label="Collapse sidebar"
            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className={cn("shrink-0", isCollapsed ? "px-3" : "px-4")}>
        <div className="h-px bg-white/10" />
      </div>

      {/* Inside a module the fold is not the user's choice, so offering to undo
          it would be a control that does nothing. */}
      {!isDrawer && isCollapsed && !folded && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Expand sidebar"
          className="mx-auto mt-3 rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      {/* Search */}
      <div className={cn("shrink-0 pt-4", isCollapsed ? "px-3" : "px-4")}>
        <button
          type="button"
          onClick={openCommandPalette}
          aria-label={isCollapsed ? "Search" : undefined}
          title={isCollapsed ? "Search" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white",
            isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5",
          )}
        >
          <Search className="h-[18px] w-[18px] shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left font-medium">Search</span>
              <kbd className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white/60">
                ⌘K
              </kbd>
            </>
          )}
        </button>
      </div>

      <div className={cn("shrink-0 pt-4", isCollapsed ? "px-3" : "px-4")}>
        <div className="h-px bg-white/10" />
      </div>

      {/* Modules. `overflow-y-auto` is a safety net for a very short viewport,
          not the normal case — six rows fit without it. */}
      <nav
        className={cn(
          "no-scrollbar flex-1 space-y-1 overflow-y-auto py-4",
          isCollapsed ? "px-3" : "px-4",
        )}
      >
        {modules.map((mod) => (
          <ModuleLink
            key={mod.id}
            module={mod}
            active={current?.id === mod.id}
            collapsed={isCollapsed}
            badgeCount={mod.id === "garage" ? unreadMessages : 0}
            onNavigate={onNavigate}
            onPeek={isDrawer ? undefined : () => setPeek(mod)}
          />
        ))}
      </nav>

      {/* Account */}
      <div className={cn("shrink-0 border-t border-white/10", isCollapsed ? "p-3" : "p-4")}>
        {isCollapsed ? (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            aria-label="Sign out"
            title="Sign out"
            className="flex w-full justify-center rounded-lg p-2.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0 ring-2 ring-white/15">
              <AvatarImage src={userImage ?? undefined} alt={userName ?? "Account"} />
              <AvatarFallback className="bg-brand-600 text-sm text-white">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <Link
              href="/dashboard/profile"
              onClick={onNavigate}
              className="min-w-0 flex-1 rounded-lg transition-opacity hover:opacity-80"
            >
              <span className="block truncate text-sm font-semibold">{userName ?? "Account"}</span>
              <span className="block truncate text-xs text-white/50">{userEmail ?? ""}</span>
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              aria-label="Sign out"
              className="shrink-0 rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  // In the drawer the module nav is already stacked above this one, so there is
  // nothing to float and no pointer to float it with.
  if (isDrawer) return rail;

  return (
    <div
      className="relative hidden lg:flex"
      // The flyout is a child of this wrapper and sits flush against the rail's
      // right edge, so moving the pointer from a row into the panel never
      // crosses a gap and never leaves this element — no close timer needed.
      onPointerLeave={closePeek}
      // Keyboard equivalent of leaving: focus landing anywhere outside closes.
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) closePeek();
      }}
    >
      {rail}
      {peek && (
        <div className="absolute left-full top-0 z-50 h-full">
          <ModuleSidebar
            role={role}
            module={peek}
            variant="flyout"
            onNavigate={closePeek}
          />
        </div>
      )}
    </div>
  );
}

function ModuleLink({
  module: mod,
  active,
  collapsed,
  badgeCount,
  onNavigate,
  onPeek,
}: {
  module: AppModule;
  active: boolean;
  collapsed: boolean;
  badgeCount: number;
  onNavigate?: () => void;
  /** Float this module's nav out. Absent in the drawer, which has no flyout. */
  onPeek?: () => void;
}) {
  const Icon = mod.icon;

  return (
    <Link
      href={mod.basePath}
      onClick={onNavigate}
      // A tap is not a hover: on a touch screen opening the panel would cover
      // the page the same tap is navigating to.
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") onPeek?.();
      }}
      onFocus={() => onPeek?.()}
      aria-current={active ? "page" : undefined}
      // Collapsed, the label is not rendered, so name the link explicitly
      // rather than leaning on `title` as the accessible name of last resort.
      aria-label={collapsed ? mod.label : undefined}
      title={collapsed ? mod.label : undefined}
      className={cn(
        "rounded-xl font-medium transition-colors",
        collapsed
          ? "flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] leading-none"
          : "flex items-center gap-3 px-3 py-2.5 text-sm",
        active
          ? "bg-brand-600 text-white shadow-sm"
          : "text-white/70 hover:bg-white/10 hover:text-white",
      )}
    >
      <span className="relative shrink-0">
        <Icon className="h-[18px] w-[18px]" />
        {collapsed && badgeCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full bg-brand-400 ring-2 ring-brand-900" />
        )}
      </span>
      {collapsed ? (
        <span className="w-full truncate text-center">{mod.short}</span>
      ) : (
        <>
          <span className="flex-1 truncate">{mod.label}</span>
          {badgeCount > 0 && (
            <span
              className={cn(
                "flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                active ? "bg-white text-brand-700" : "bg-brand-600 text-white",
              )}
            >
              <MessageSquare className="mr-0.5 h-3 w-3" />
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )}
        </>
      )}
    </Link>
  );
}
