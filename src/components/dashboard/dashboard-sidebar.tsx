"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  Boxes,
  Car,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Settings,
  Ship,
  ShoppingBag,
  Store,
  Users,
  Wrench,
  FileText,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

const iconMap = {
  LayoutDashboard,
  Heart,
  Ship,
  ShoppingBag,
  MessageSquare,
  Settings,
  Car,
  Boxes,
  BarChart3,
  Store,
  Users,
  Wrench,
  Package,
  FileText,
  Receipt,
  ShieldCheck,
};

type IconName = keyof typeof iconMap;

const customerNav: { label: string; href: string; icon: IconName }[] = [
  { label: "Overview", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Saved Vehicles", href: "/dashboard/saved", icon: "Heart" },
  { label: "My Imports", href: "/dashboard/imports", icon: "Ship" },
  { label: "My Orders", href: "/dashboard/orders", icon: "ShoppingBag" },
  { label: "Messages", href: "/dashboard/messages", icon: "MessageSquare" },
  { label: "Profile", href: "/dashboard/profile", icon: "Settings" },
];

const dealerNav: { label: string; href: string; icon: IconName }[] = [
  { label: "Overview", href: "/dashboard/dealer", icon: "LayoutDashboard" },
  { label: "My Listings", href: "/dashboard/dealer/listings", icon: "Car" },
  { label: "Analytics", href: "/dashboard/dealer/analytics", icon: "BarChart3" },
  { label: "Inquiries", href: "/dashboard/messages", icon: "MessageSquare" },
  { label: "Profile", href: "/dashboard/profile", icon: "Settings" },
];

const sellerNav: { label: string; href: string; icon: IconName }[] = [
  { label: "Overview", href: "/dashboard/seller", icon: "LayoutDashboard" },
  { label: "Products", href: "/dashboard/seller/products", icon: "Boxes" },
  { label: "Orders", href: "/dashboard/seller/orders", icon: "Receipt" },
  { label: "Analytics", href: "/dashboard/seller/analytics", icon: "BarChart3" },
  { label: "Profile", href: "/dashboard/profile", icon: "Settings" },
];

const adminNav: { label: string; href: string; icon: IconName }[] = [
  { label: "Overview", href: "/admin", icon: "LayoutDashboard" },
  { label: "Users", href: "/admin/users", icon: "Users" },
  { label: "Vehicles", href: "/admin/vehicles", icon: "Car" },
  { label: "Parts", href: "/admin/parts", icon: "Package" },
  { label: "Dealers", href: "/admin/dealers", icon: "Store" },
  { label: "Orders", href: "/admin/orders", icon: "Receipt" },
  { label: "Imports", href: "/admin/imports", icon: "Ship" },
  { label: "Duty Rates", href: "/admin/duty-rates", icon: "FileText" },
  { label: "Reviews", href: "/admin/reviews", icon: "ShieldCheck" },
  { label: "Blog", href: "/admin/blog", icon: "FileText" },
];

export function DashboardSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const nav =
    role === "ADMIN"
      ? adminNav
      : role === "DEALER"
        ? dealerNav
        : role === "PARTS_SELLER"
          ? sellerNav
          : customerNav;

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {nav.map((item) => {
          const Icon = iconMap[item.icon];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4.5 w-4.5" /> Sign out
        </button>
      </div>
    </aside>
  );
}
