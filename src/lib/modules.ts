import {
  BadgeCheck,
  Banknote,
  BarChart3,
  Bookmark,
  Boxes,
  Building2,
  Calculator,
  Car,
  ClipboardCheck,
  Coins,
  Database,
  FileSearch,
  FileText,
  Gauge,
  Heart,
  LayoutGrid,
  Landmark,
  MessageSquare,
  Package,
  Plus,
  Receipt,
  Settings,
  ShieldCheck,
  Ship,
  ShoppingBag,
  Store,
  UserCheck,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import { isAdmin, isDealer, isPartsSeller, isSupplier } from "@/lib/roles";

/**
 * Application modules.
 *
 * A module is a part of the authenticated app large enough to carry its own
 * navigation. When one is open the main sidebar folds to its icon rail and the
 * module's sidebar takes its place — the shell itself never changes, which is
 * what lets a new module be added here and nowhere else.
 *
 * Public marketing routes are deliberately absent: they are a different
 * experience with different chrome, and the middleware moves a signed-in
 * visitor from one to the other (see `shell-mirrors.ts`).
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
  /**
   * One word for the collapsed rail. The rail is the primary navigation
   * whenever a module is open, so it carries text as well as an icon — six
   * unlabelled glyphs are a memory test, not a menu.
   */
  short: string;
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
  short: "Market",
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
    { label: "Suppliers", href: "/app/marketplace/suppliers", icon: Building2 },
    { label: "Services", href: "/app/marketplace/services", icon: Wrench },
    { label: "Saved vehicles", href: "/app/marketplace/saved", icon: Heart },
    { label: "Saved searches", href: "/app/marketplace/searches", icon: Bookmark },
    {
      // Every signed-in account may sell a car — POST /api/vehicles has
      // always allowed it, and the query behind this page is keyed on
      // sellerId, not on a dealership. Dealer-specific tooling (leads,
      // analytics, verification) stays in the dealer console.
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
    {
      label: "Cart",
      href: "/app/marketplace/cart",
      icon: ShoppingBag,
      description: "Parts you're ready to buy",
    },
  ],
};

const calculators: AppModule = {
  id: "calculators",
  label: "Calculators",
  short: "Tools",
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

const imports: AppModule = {
  id: "imports",
  label: "Imports",
  short: "Imports",
  icon: Ship,
  basePath: "/app/imports",
  blurb: "Source it, ship it, clear it — and know the cost before you commit.",
  items: [
    {
      label: "Start an import",
      href: "/app/imports/new",
      icon: Plus,
      description: "Tell us what you want and we'll quote it",
    },
    { label: "My imports", href: "/app/imports/mine", icon: Ship },
    {
      label: "Track a shipment",
      href: "/app/imports/track",
      icon: FileSearch,
      description: "Look one up by its reference",
    },
    {
      label: "Share a duty bill",
      href: "/app/imports/duty-check",
      icon: Landmark,
      description: "Add a real ICUMS assessment",
    },
  ],
};

const garage: AppModule = {
  id: "garage",
  label: "My Garage",
  short: "Garage",
  icon: LayoutGrid,
  basePath: "/dashboard",
  blurb: "Your imports, orders, inspections and conversations.",
  items: [
    {
      label: "Overview",
      href: "/dashboard",
      icon: LayoutGrid,
      exact: true,
      description: "What's happening with your account",
    },
    { label: "My orders", href: "/dashboard/orders", icon: ShoppingBag },
    { label: "Inspections", href: "/dashboard/inspections", icon: ClipboardCheck },
    { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { label: "Profile & settings", href: "/dashboard/profile", icon: Settings },
    {
      label: "Upgrade my account",
      href: "/dashboard/upgrade",
      icon: BadgeCheck,
      description: "Apply to become a dealer, seller, supplier or importer",
    },
  ],
};

const dealerConsole: AppModule = {
  id: "dealer",
  label: "Dealer console",
  short: "Dealer",
  icon: Store,
  basePath: "/dashboard/dealer",
  blurb: "Your dealership: stock, leads and performance.",
  items: [
    {
      label: "Overview",
      href: "/dashboard/dealer",
      icon: LayoutGrid,
      exact: true,
      description: "How your listings are performing",
    },
    { label: "My listings", href: "/app/marketplace/listings", icon: ClipboardCheck },
    { label: "Leads", href: "/dashboard/dealer/leads", icon: MessageSquare },
    { label: "Analytics", href: "/dashboard/dealer/analytics", icon: BarChart3 },
    { label: "Get verified", href: "/dashboard/dealer/verification", icon: BadgeCheck },
  ],
};

const sellerConsole: AppModule = {
  id: "seller",
  label: "Seller console",
  short: "Seller",
  icon: Boxes,
  basePath: "/dashboard/seller",
  blurb: "Your parts store: products, orders and sales.",
  items: [
    {
      label: "Overview",
      href: "/dashboard/seller",
      icon: LayoutGrid,
      exact: true,
      description: "How your store is performing",
    },
    { label: "Products", href: "/dashboard/seller/products", icon: Boxes },
    { label: "Orders", href: "/dashboard/seller/orders", icon: Receipt },
    { label: "Analytics", href: "/dashboard/seller/analytics", icon: BarChart3 },
  ],
};

const supplierConsole: AppModule = {
  id: "supplier",
  label: "Supplier console",
  short: "Supply",
  icon: Building2,
  basePath: "/dashboard/supplier",
  blurb: "Your wholesale profile and the enquiries buyers send you.",
  items: [
    {
      label: "Overview",
      href: "/dashboard/supplier",
      icon: LayoutGrid,
      exact: true,
      description: "Enquiries at a glance",
    },
    { label: "Enquiries", href: "/dashboard/supplier/enquiries", icon: MessageSquare },
    { label: "My profile", href: "/dashboard/supplier/profile", icon: Settings },
  ],
};

const admin: AppModule = {
  id: "admin",
  label: "Admin",
  short: "Admin",
  icon: ShieldCheck,
  basePath: "/admin",
  blurb: "Platform operations, moderation and configuration.",
  items: [
    { label: "Overview", href: "/admin", icon: LayoutGrid, exact: true },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Vehicles", href: "/admin/vehicles", icon: Car },
    { label: "Parts", href: "/admin/parts", icon: Package },
    { label: "Dealers", href: "/admin/dealers", icon: Store },
    { label: "Verifications", href: "/admin/verifications", icon: BadgeCheck },
    { label: "Role applications", href: "/admin/role-applications", icon: UserCheck },
    { label: "Inspections", href: "/admin/inspections", icon: ClipboardCheck },
    { label: "Orders", href: "/admin/orders", icon: Receipt },
    { label: "Imports", href: "/admin/imports", icon: Ship },
    { label: "Escrow", href: "/admin/escrow", icon: Wallet },
    { label: "Duty rates", href: "/admin/duty-rates", icon: FileText },
    { label: "Duty data", href: "/admin/assessments", icon: Database },
    { label: "Accuracy", href: "/admin/accuracy", icon: Gauge },
    { label: "Reviews", href: "/admin/reviews", icon: ShieldCheck },
    { label: "Blog", href: "/admin/blog", icon: FileText },
  ],
};

/**
 * Every area of the authenticated app large enough to carry its own navigation.
 *
 * Note that a module's `basePath` need not sit under /app — the two consoles and
 * the admin area keep the URLs they have always had. A module is a navigation
 * grouping, not a directory, so bringing an existing area under one costs a
 * registry entry and moves no pages.
 *
 * A module is only listed once its routes exist, so the registry never
 * advertises navigation that dead-ends.
 */
export const MODULES: AppModule[] = [
  marketplace,
  calculators,
  imports,
  dealerConsole,
  sellerConsole,
  supplierConsole,
  garage,
  admin,
];

/**
 * The module a path belongs to, or null if it is a plain shell page.
 *
 * Longest base path wins, so `/dashboard/dealer/leads` resolves to the dealer
 * console rather than to Garage, whose `/dashboard` also matches. Resolving by
 * specificity rather than by array order means a new module can be appended
 * anywhere in the list without silently stealing another one's routes.
 */
export function moduleForPath(pathname: string): AppModule | null {
  let best: AppModule | null = null;
  for (const m of MODULES) {
    if (pathname !== m.basePath && !pathname.startsWith(`${m.basePath}/`)) continue;
    if (!best || m.basePath.length > best.basePath.length) best = m;
  }
  return best;
}

/** The modules a role may enter, in sidebar order. */
export function modulesFor(role: UserRole | null): AppModule[] {
  if (!role) return [];
  return MODULES.filter((m) => {
    if (m.id === "admin") return isAdmin(role);
    if (m.id === "dealer") return isDealer(role);
    if (m.id === "seller") return isPartsSeller(role);
    if (m.id === "supplier") return isSupplier(role);
    return true;
  });
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

/**
 * Paths that fold the main sidebar to its rail without belonging to a module.
 *
 * Search is the only one today. Its results span vehicles, parts, dealers,
 * services and the blog, so claiming it for any single module would light up
 * the wrong sidebar — but leaving it as the one page in the app with a
 * different sidebar width is its own kind of wrong. It gets the rail and no
 * module sidebar: the layout stays put, and nothing lies about where you are.
 */
const RAIL_ONLY_PATHS = ["/app/search"];

/** Whether the main sidebar should be folded, module or not. */
export function usesRail(pathname: string): boolean {
  if (moduleForPath(pathname) !== null) return true;
  return RAIL_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
