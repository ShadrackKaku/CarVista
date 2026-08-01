"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import {
  ArrowRight,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Ship,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import { isNavItemActive, navigationFor, type NavItem } from "@/lib/navigation";
import { moduleForPath } from "@/lib/modules";
import { openCommandPalette } from "@/lib/ui-events";

const COLLAPSE_KEY = "carvista:sidebar-collapsed";
const CLOSED_SECTIONS_KEY = "carvista:sidebar-closed-sections";

/**
 * Folded on first run. Marketplace is the public site, already one click away
 * via "Back to site" and the public header — so a signed-in user starts with
 * their own work in view instead of scrolling past the storefront to reach it.
 * An explicit choice, in either direction, replaces this and persists.
 */
const DEFAULT_CLOSED_SECTIONS = ["marketplace"];

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
 * The single sidebar — a full-height brand panel that never scrolls with the
 * page. Every destination a signed-in user can reach lives here, grouped by
 * what they're trying to do rather than by which part of the app owns the
 * route. Only the nav list scrolls, and only when it has to; the logo, search,
 * promo and account block stay pinned.
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
  const sections = navigationFor(role);
  const isDrawer = variant === "drawer";
  const [collapsed, setCollapsed] = useState(false);
  const [closedSections, setClosedSections] = useState<string[]>(DEFAULT_CLOSED_SECTIONS);
  const navRef = useRef<HTMLElement>(null);

  // Restore which sections the user folded away. Read after mount so the
  // server and first client render agree.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CLOSED_SECTIONS_KEY);
      // Absent key means "never chosen" — keep the default. An empty array is
      // a real choice (everything unfolded) and must be honoured.
      if (raw) setClosedSections(JSON.parse(raw));
    } catch {
      // Corrupt or unavailable storage just falls back to the default.
    }
  }, []);

  const toggleSection = useCallback((id: string) => {
    setClosedSections((prev) => {
      const next = prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
      try {
        window.localStorage.setItem(CLOSED_SECTIONS_KEY, JSON.stringify(next));
      } catch {
        // Preference is a nicety; failing to persist it must not break nav.
      }
      return next;
    });
  }, []);

  // Even with sections folded, an admin's open section can outrun the panel.
  // Bring the current page into view so a user always knows where they are.
  useEffect(() => {
    navRef.current
      ?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [pathname, closedSections]);

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

  // Inside a module, the main sidebar folds to its rail so the module's own
  // navigation can take the space (§10). It is never removed — the rail keeps
  // every other destination one click away, and the user's own collapse
  // preference is left untouched for when they leave the module.
  const insideModule = moduleForPath(pathname) !== null;
  const isCollapsed = !isDrawer && (collapsed || insideModule);

  return (
    <aside
      className={cn(
        // The brand panel. Deep periwinkle in both themes — it is a branded
        // surface, not a themed one.
        "flex h-full flex-col bg-brand-900 text-white",
        isDrawer ? "w-full" : "hidden shrink-0 transition-[width] duration-200 lg:flex",
        !isDrawer && (isCollapsed ? "w-[4.75rem]" : "w-[17rem]"),
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

      {/* Inside a module the fold is not the user's choice, so offering to
          undo it would be a control that does nothing. */}
      {!isDrawer && isCollapsed && !insideModule && (
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

      {/* Navigation — the only part that scrolls. An admin has ~30 entries, so
          it will scroll; the dividers above and below make a clipped row read
          as content passing under a line rather than as a broken layout. */}
      <nav
        ref={navRef}
        className={cn(
          "no-scrollbar flex-1 space-y-5 overflow-y-auto py-4",
          isCollapsed ? "px-3" : "px-4",
        )}
      >
        {sections.map((section) => {
          const holdsCurrentPage = section.items.some((item) => isNavItemActive(pathname, item));
          // A folded section still opens itself when you are inside it —
          // otherwise the sidebar would hide where you currently are.
          const open = isCollapsed || holdsCurrentPage || !closedSections.includes(section.id);

          return (
            <div key={section.id}>
              {!isCollapsed && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={open}
                  className="group flex w-full items-center gap-1.5 rounded-lg px-3 pb-1.5 pt-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/35 transition-colors hover:text-white/70"
                >
                  <span className="flex-1 text-left">{section.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-transform",
                      !open && "-rotate-90",
                    )}
                  />
                </button>
              )}
              {open && (
                <div className="space-y-1">
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
              )}
            </div>
          );
        })}
      </nav>

      {/* Promo */}
      {!isCollapsed && (
        <div className="shrink-0 border-t border-white/10 p-4">
          <div className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-inset ring-white/10">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Ship className="h-4 w-4 text-brand-300" />
              Importing a car?
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-white/60">
              We source, ship, clear and deliver — end to end.
            </p>
            <Link
              href="/import"
              onClick={onNavigate}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-50"
            >
              Start an import <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Account */}
      <div className={cn("shrink-0 border-t border-white/10", isCollapsed ? "p-3" : "p-4")}>
        {isCollapsed ? (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
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
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">
              Soon
            </span>
          )}
          {badgeCount > 0 && (
            <span
              className={cn(
                "flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                active ? "bg-white text-brand-700" : "bg-brand-600 text-white",
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
    "flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors",
    collapsed ? "justify-center px-0" : "px-3",
  );

  // "Soon" items set the shape of the workspace without pretending to work.
  if (item.soon) {
    return (
      <span
        title={collapsed ? `${item.label} — coming soon` : undefined}
        aria-disabled
        className={cn(base, "cursor-default text-white/30")}
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
      // Collapsed, the label is not rendered, so name the link explicitly
      // rather than leaning on `title` as the accessible name of last resort.
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        base,
        active
          ? "bg-brand-600 text-white shadow-sm"
          : "text-white/70 hover:bg-white/10 hover:text-white",
      )}
    >
      {inner}
    </Link>
  );
}
