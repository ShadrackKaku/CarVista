"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { isNavItemActive, navigationFor, type NavItem } from "@/lib/navigation";
import { openCommandPalette } from "@/lib/ui-events";

const COLLAPSE_KEY = "carvista:sidebar-collapsed";

export interface AppSidebarProps {
  role: UserRole;
  unreadMessages?: number;
  /** Rendered inside a mobile drawer: always expanded, no collapse control. */
  variant?: "fixed" | "drawer";
  onNavigate?: () => void;
}

/**
 * The single sidebar. Every destination a signed-in user can reach lives here,
 * grouped by what they're trying to do rather than by which part of the app
 * happens to own the route.
 */
export function AppSidebar({
  role,
  unreadMessages = 0,
  variant = "fixed",
  onNavigate,
}: AppSidebarProps) {
  const pathname = usePathname();
  const sections = navigationFor(role);
  const isDrawer = variant === "drawer";
  const [collapsed, setCollapsed] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // The tree is long enough that Admin and Business sit below the fold. Bring
  // the current page into view on mount so a user always knows where they are.
  useEffect(() => {
    navRef.current
      ?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

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

  const isCollapsed = !isDrawer && collapsed;

  return (
    <aside
      className={cn(
        "flex flex-col bg-card",
        isDrawer
          ? "h-full w-full"
          : "sticky top-0 hidden h-screen shrink-0 border-r transition-[width] duration-200 lg:flex",
        !isDrawer && (isCollapsed ? "w-[4.5rem]" : "w-64"),
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center",
          isCollapsed ? "justify-center px-2" : "justify-between px-5",
        )}
      >
        <Logo withText={!isCollapsed} />
        {!isDrawer && !isCollapsed && (
          <button
            type="button"
            onClick={toggle}
            aria-label="Collapse sidebar"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {!isDrawer && isCollapsed && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Expand sidebar"
          className="mx-auto mb-2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      <div className={cn("shrink-0 pb-2", isCollapsed ? "px-2" : "px-3")}>
        <button
          type="button"
          onClick={openCommandPalette}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg border border-dashed bg-background/60 text-sm text-muted-foreground transition-colors hover:border-solid hover:bg-accent hover:text-foreground",
            isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5",
          )}
        >
          <Search className="h-4 w-4 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">Search…</span>
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">
                ⌘K
              </kbd>
            </>
          )}
        </button>
      </div>

      <nav
        ref={navRef}
        className={cn(
          "flex-1 space-y-6 overflow-y-auto pb-4",
          isCollapsed ? "px-2" : "px-3",
        )}
      >
        {sections.map((section) => (
          <div key={section.id}>
            {!isCollapsed && (
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarLink
                  key={`${section.id}:${item.href}`}
                  item={item}
                  active={isNavItemActive(pathname, item)}
                  collapsed={isCollapsed}
                  badgeCount={item.badge === "messages" ? unreadMessages : 0}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn("shrink-0 border-t py-3", isCollapsed ? "px-2" : "px-3")}>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          title={isCollapsed ? "Sign out" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
            isCollapsed ? "justify-center px-0" : "px-3",
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!isCollapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({
  item,
  active,
  collapsed,
  badgeCount,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  badgeCount: number;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  const inner = (
    <>
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.soon && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Soon
            </span>
          )}
          {badgeCount > 0 && (
            <span
              className={cn(
                "flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                active ? "bg-brand-600 text-white" : "bg-brand-600/10 text-brand-700 dark:text-brand-200",
              )}
            >
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )}
        </>
      )}
    </>
  );

  const base = cn(
    "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors",
    collapsed ? "justify-center px-0" : "px-3",
  );

  // "Soon" items set the shape of the workspace without pretending to work.
  if (item.soon) {
    return (
      <span
        title={collapsed ? `${item.label} — coming soon` : undefined}
        aria-disabled
        className={cn(base, "cursor-default text-muted-foreground/50")}
      >
        {inner}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        base,
        active
          ? "bg-brand-600/10 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {inner}
    </Link>
  );
}
