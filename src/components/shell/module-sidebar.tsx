"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect } from "react";
import type { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  isModuleItemActive,
  moduleForPath,
  moduleItemsFor,
  type AppModule,
  type ModuleNavItem,
} from "@/lib/modules";

/**
 * A module's own navigation.
 *
 * On the desktop this is the flyout that opens off the main rail; on a phone it
 * is the top half of the navigation drawer. Both render the same list, so a
 * module gains a destination in the registry and nowhere else.
 *
 * It scrolls independently of whatever it sits in (§11): a long module nav must
 * never make the page scroll, and must never push the content column around.
 */
export function ModuleSidebar({
  role,
  onNavigate,
  variant = "column",
  module: explicitModule,
}: {
  role: UserRole | null;
  onNavigate?: () => void;
  /**
   * `column` is a plain full-height panel. `drawer` stacks above the main nav on
   * small screens, where there is no room for a second column — it caps its own
   * height so the main nav below it stays reachable. `flyout` is the desktop
   * overlay: it floats over the content, so it carries its own elevation.
   */
  variant?: "column" | "drawer" | "flyout";
  /**
   * Show this module rather than the one the URL is in. The rail passes the
   * module being hovered, which is how you can peek into Imports without
   * leaving Marketplace.
   */
  module?: AppModule;
}) {
  const pathname = usePathname();
  const activeModule = explicitModule ?? moduleForPath(pathname);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    navRef.current
      ?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  if (!activeModule) return null;
  const items = moduleItemsFor(activeModule, role);
  const Icon = activeModule.icon;

  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col bg-card",
        variant === "drawer" && "max-h-[55%] border-b",
        variant === "column" && "h-full border-r lg:w-64",
        variant === "flyout" && "h-full w-64 border-r shadow-2xl",
      )}
    >
      <div className="shrink-0 px-5 pb-4 pt-5">
        <p className="flex items-center gap-2 font-display text-base font-bold tracking-tight">
          <Icon className="h-[18px] w-[18px] text-brand-600" />
          {activeModule.label}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{activeModule.blurb}</p>
      </div>

      <nav ref={navRef} className="no-scrollbar flex-1 space-y-1 overflow-y-auto px-3 pb-5">
        {items.map((item) => (
          <ModuleLink
            key={item.href}
            item={item}
            active={isModuleItemActive(pathname, item)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </aside>
  );
}

function ModuleLink({
  item,
  active,
  onNavigate,
}: {
  item: ModuleNavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const base =
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";

  if (item.soon) {
    return (
      <span aria-disabled className={cn(base, "cursor-default text-muted-foreground/50")}>
        <Icon className="h-[18px] w-[18px] shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          Soon
        </span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        base,
        active
          ? "bg-brand-600/10 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
    </Link>
  );
}
