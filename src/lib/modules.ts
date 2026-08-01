import {
  Banknote,
  Bookmark,
  Calculator,
  Car,
  ClipboardCheck,
  Coins,
  FileSearch,
  Heart,
  LayoutGrid,
  Landmark,
  Package,
  Plus,
  Receipt,
  Ship,
  Store,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@prisma/client";

/**
 * Application modules.
 *
 * A module is a part of the authenticated app large enough to carry its own
 * navigation. When one is open the main sidebar folds to its icon rail and the
 * module's sidebar takes its place — the shell itself never changes, which is
 * what lets a new module be added here and nowhere else.
 *
 * Everything below lives under /app, inside the authenticated shell. Public
 * marketing routes are deliberately absent: they are a different experience
 * with different chrome.
 */
export interface ModuleNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  /** Roles that see this item. Omit for everyone signed in. */
  roles?: UserRole[];
  /** Only highlight on an exact path match — for module overviews. */
  exact?: boolean;
  /** Rendered, but inert: the shape is set before the data behind it exists. */
  soon?: boolean;
}

export interface AppModule {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Everything under this path belongs to the module. */
  basePath: string;
  /** One line, shown at the head of the module sidebar. */
  blurb: string;
  items: ModuleNavItem[];
}

const marketplace: AppModule = {
  id: "marketplace",
  label: "Marketplace",
  icon: Store,
  basePath: "/app/marketplace",
  blurb: "Vehicles, parts, dealers and services — everything on the platform.",
  items: [
    {
      label: "Overview",
      href: "/app/marketplace",
      icon: LayoutGrid,
      exact: true,
      description: "What's new across the marketplace",
    },
    { label: "Vehicles", href: "/app/marketplace/vehicles", icon: Car },
    { label: "Parts", href: "/app/marketplace/parts", icon: Package },
    { label: "Dealers", href: "/app/marketplace/dealers", icon: Store },
    { label: "Services", href: "/app/marketplace/services", icon: Wrench },
    { label: "Saved vehicles", href: "/app/marketplace/saved", icon: Heart },
    { label: "Saved searches", href: "/app/marketplace/searches", icon: Bookmark },
    {
      // Every signed-in account may sell a car — POST /api/vehicles has
      // always allowed it, and the query behind this page is keyed on
      // sellerId, not on a dealership. Dealer-specific tooling (leads,
      // analytics, verification) stays in the Business section.
      label: "My listings",
      href: "/app/marketplace/listings",
      icon: ClipboardCheck,
      description: "Vehicles you have on the market",
    },
    {
      label: "List a vehicle",
      href: "/app/marketplace/listings/new",
      icon: Plus,
      description: "Put a car in front of buyers",
    },
  ],
};

const calculators: AppModule = {
  id: "calculators",
  label: "Calculators",
  icon: Calculator,
  basePath: "/app/calculators",
  blurb: "Price an import before you commit — off real customs assessments.",
  items: [
    {
      label: "All tools",
      href: "/app/calculators",
      icon: LayoutGrid,
      exact: true,
      description: "The full workspace",
    },
    {
      label: "Landed cost",
      href: "/app/calculators/import-duty",
      icon: Calculator,
      description: "Duty, levies, shipping and clearing",
    },
    { label: "Shipping", href: "/app/calculators/shipping", icon: Ship },
    { label: "Financing", href: "/app/calculators/financing", icon: Banknote },
    { label: "Taxes & duties", href: "/app/calculators/taxes", icon: Receipt },
    { label: "Currency & FX", href: "/app/calculators/fx", icon: Coins, soon: true },
    { label: "HS code lookup", href: "/app/calculators/hs-code", icon: FileSearch, soon: true },
    { label: "Share a duty bill", href: "/app/calculators/share-bill", icon: Landmark },
  ],
};

/**
 * Imports is the next module to land here. It stays in the main sidebar until
 * then — a module is only listed once its routes exist, so the registry never
 * advertises navigation that goes nowhere.
 */
export const MODULES: AppModule[] = [marketplace, calculators];

/** The module a path belongs to, or null if it is a plain shell page. */
export function moduleForPath(pathname: string): AppModule | null {
  return (
    MODULES.find(
      (m) => pathname === m.basePath || pathname.startsWith(`${m.basePath}/`),
    ) ?? null
  );
}

/** Module items a role may see. */
export function moduleItemsFor(module: AppModule, role: UserRole | null): ModuleNavItem[] {
  return module.items.filter((item) => !item.roles || (role != null && item.roles.includes(role)));
}

/** Whether a module nav item should read as the current page. */
export function isModuleItemActive(pathname: string, item: ModuleNavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
