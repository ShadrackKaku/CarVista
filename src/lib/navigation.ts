import {
  BadgeCheck,
  BarChart3,
  Bookmark,
  Boxes,
  Car,
  ClipboardCheck,
  Database,
  FileText,
  Gauge,
  Heart,
  LayoutDashboard,
  MessageSquare,
  Package,
  Receipt,
  Settings,
  Ship,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import { TOOLS } from "./tools";

/**
 * The whole system's navigation, in one tree.
 *
 * Previously the marketplace, the dashboards and the admin console each had
 * their own idea of where things were. One tree means a signed-in user gets a
 * single sidebar that reaches everything they're allowed to touch, and the
 * command palette gets its index for free.
 */
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shown in the command palette under the label. */
  description?: string;
  /** Roles that see this item. Omit for everyone. */
  roles?: UserRole[];
  /** Only highlight on an exact path match — for section overviews. */
  exact?: boolean;
  /** Live counter to render as a pill. */
  badge?: "messages";
  /** Extra words the palette should match on. */
  keywords?: string[];
  /** Not yet built: rendered, but inert. */
  soon?: boolean;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
  /** Roles that see this section at all. Omit for everyone. */
  roles?: UserRole[];
  /** Hide from signed-out visitors. */
  requiresAuth?: boolean;
}

const DEALER_ONLY: UserRole[] = ["DEALER"];
const SELLER_ONLY: UserRole[] = ["PARTS_SELLER"];
const ADMIN_ONLY: UserRole[] = ["ADMIN", "SUPER_ADMIN"];

const marketplace: NavSection = {
  id: "marketplace",
  label: "Marketplace",
  // Everything here lives under /app, inside the authenticated shell. Signed-out
  // visitors get the public marketing site and its own header instead.
  requiresAuth: true,
  items: [
    {
      label: "Browse vehicles",
      href: "/app/marketplace/vehicles",
      icon: Car,
      description: "Every car listed on CarVista",
      keywords: ["cars", "search", "buy", "listings"],
    },
    { label: "Parts", href: "/app/marketplace/parts", icon: Package, description: "Genuine and aftermarket parts" },
    { label: "Services", href: "/app/marketplace/services", icon: Wrench, description: "Garages and specialists" },
    { label: "Dealers", href: "/app/marketplace/dealers", icon: Store, description: "Verified dealers near you" },
    {
      label: "My listings",
      href: "/app/marketplace/listings",
      icon: ClipboardCheck,
      description: "Vehicles you have on the market",
      keywords: ["sell", "selling", "inventory"],
    },
  ],
};

const tools: NavSection = {
  id: "tools",
  label: "Tools",
  requiresAuth: true,
  items: [
    {
      label: "All tools",
      href: "/app/calculators",
      icon: LayoutDashboard,
      description: "The full workspace",
      exact: true,
      keywords: ["calculator", "calculators", "workspace"],
    },
    ...TOOLS.map(
      (tool): NavItem => ({
        label: tool.short,
        href: tool.href,
        icon: tool.icon,
        description: tool.blurb,
        keywords: tool.keywords,
        soon: tool.status === "SOON",
      }),
    ),
  ],
};

const garage: NavSection = {
  id: "garage",
  label: "My Garage",
  requiresAuth: true,
  items: [
    {
      label: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      exact: true,
      description: "Your activity at a glance",
    },
    { label: "Saved vehicles", href: "/app/marketplace/saved", icon: Heart, keywords: ["wishlist", "favourites"] },
    { label: "Saved searches", href: "/app/marketplace/searches", icon: Bookmark, keywords: ["alerts"] },
    { label: "My imports", href: "/app/imports/mine", icon: Ship },
    {
      label: "Start an import",
      href: "/app/imports/new",
      icon: Ship,
      description: "Source, ship, clear and deliver",
      keywords: ["importing", "auction", "shipping"],
    },
    {
      label: "Track a shipment",
      href: "/app/imports/track",
      icon: Ship,
      keywords: ["tracking", "reference", "where is my car"],
    },
    { label: "My orders", href: "/dashboard/orders", icon: ShoppingBag },
    { label: "Inspections", href: "/dashboard/inspections", icon: ClipboardCheck },
    { label: "Messages", href: "/dashboard/messages", icon: MessageSquare, badge: "messages" },
  ],
};

const business: NavSection = {
  id: "business",
  label: "Business",
  requiresAuth: true,
  roles: ["DEALER", "PARTS_SELLER"],
  items: [
    {
      label: "Dealer overview",
      href: "/dashboard/dealer",
      icon: LayoutDashboard,
      exact: true,
      roles: DEALER_ONLY,
    },
    { label: "Leads", href: "/dashboard/dealer/leads", icon: MessageSquare, roles: DEALER_ONLY },
    {
      label: "Analytics",
      href: "/dashboard/dealer/analytics",
      icon: BarChart3,
      roles: DEALER_ONLY,
    },
    {
      label: "Get verified",
      href: "/dashboard/dealer/verification",
      icon: BadgeCheck,
      roles: DEALER_ONLY,
    },
    {
      label: "Seller overview",
      href: "/dashboard/seller",
      icon: LayoutDashboard,
      exact: true,
      roles: SELLER_ONLY,
    },
    { label: "Products", href: "/dashboard/seller/products", icon: Boxes, roles: SELLER_ONLY },
    { label: "Orders", href: "/dashboard/seller/orders", icon: Receipt, roles: SELLER_ONLY },
    {
      label: "Analytics",
      href: "/dashboard/seller/analytics",
      icon: BarChart3,
      roles: SELLER_ONLY,
    },
  ],
};

const admin: NavSection = {
  id: "admin",
  label: "Admin",
  requiresAuth: true,
  roles: ADMIN_ONLY,
  items: [
    { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Vehicles", href: "/admin/vehicles", icon: Car },
    { label: "Parts", href: "/admin/parts", icon: Package },
    { label: "Dealers", href: "/admin/dealers", icon: Store },
    { label: "Verifications", href: "/admin/verifications", icon: BadgeCheck },
    { label: "Role applications", href: "/admin/role-applications", icon: BadgeCheck },
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

const account: NavSection = {
  id: "account",
  label: "Account",
  requiresAuth: true,
  items: [
    { label: "Profile & settings", href: "/dashboard/profile", icon: Settings },
    {
      label: "Upgrade my account",
      href: "/dashboard/upgrade",
      icon: BadgeCheck,
      description: "Apply to become a dealer, seller, supplier or importer",
      keywords: ["dealer", "seller", "supplier", "importer", "role", "apply", "upgrade"],
    },
  ],
};

const ALL_SECTIONS: NavSection[] = [marketplace, tools, garage, business, admin, account];

/**
 * The sections and items a given role should see. Pass `null` for a signed-out
 * visitor — they get the public sections only.
 */
export function navigationFor(role: UserRole | null): NavSection[] {
  return ALL_SECTIONS.filter((section) => {
    if (section.requiresAuth && !role) return false;
    if (section.roles && (!role || !section.roles.includes(role))) return false;
    return true;
  })
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || (role != null && item.roles.includes(role)),
      ),
    }))
    .filter((section) => section.items.length > 0);
}

/** Whether a nav item should read as the current page. */
export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Where a role lands when they open the app. Dealers and sellers care about
 * their own console first; everyone else starts in their garage.
 */
export function homeHrefFor(role: UserRole | null): string {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "/admin";
    case "DEALER":
      return "/dashboard/dealer";
    case "PARTS_SELLER":
      return "/dashboard/seller";
    case null:
    case undefined:
      return "/";
    default:
      return "/dashboard";
  }
}
