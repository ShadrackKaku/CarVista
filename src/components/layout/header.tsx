"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { NavSearch } from "@/components/search/nav-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NAV_LINKS } from "@/lib/constants";
import { cn, getInitials } from "@/lib/utils";
import { useCartStore, useWishlistStore } from "@/store/cart-store";

/** A small count bubble on a nav icon. */
function CountBadge({ count }: { count: number }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold leading-none text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [mobileQuery, setMobileQuery] = useState("");
  const user = session?.user;

  // Mobile menu search: navigate to the same server-side search the desktop
  // nav search uses, then close the menu sheet.
  function submitMobileSearch(e: FormEvent) {
    e.preventDefault();
    const value = mobileQuery.trim();
    setOpen(false);
    setMobileQuery("");
    router.push(value ? `/vehicles?q=${encodeURIComponent(value)}` : "/vehicles");
  }

  // Live counts for the wishlist + cart icons.
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const savedCount = useWishlistStore((s) => s.ids.length);
  const setSavedIds = useWishlistStore((s) => s.setIds);

  // Persisted stores hydrate on the client, so only show badges after mount to
  // avoid a server/client markup mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Keep the wishlist badge in sync with the database across sessions/devices.
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/saved/vehicles")
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.ids)) setSavedIds(d.ids);
        })
        .catch(() => {});
    } else if (status === "unauthenticated") {
      setSavedIds([]);
    }
  }, [status, setSavedIds]);

  const dashboardHref =
    user?.role === "ADMIN"
      ? "/admin"
      : user?.role === "DEALER"
        ? "/dashboard/dealer"
        : user?.role === "PARTS_SELLER"
          ? "/dashboard/seller"
          : "/dashboard";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-lg">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                    active && "bg-accent text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <NavSearch />
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative hidden sm:inline-flex"
            aria-label={`Wishlist${mounted && savedCount ? ` (${savedCount})` : ""}`}
          >
            <Link href="/dashboard/saved">
              <Heart className="h-5 w-5" />
              {mounted && savedCount > 0 && <CountBadge count={savedCount} />}
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={`Cart${mounted && cartCount ? ` (${cartCount})` : ""}`}
          >
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {mounted && cartCount > 0 && <CountBadge count={cartCount} />}
            </Link>
          </Button>
          <ThemeToggle />

          {status === "authenticated" && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account menu"
                  className="ml-1 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold">{user.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={dashboardHref}>
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <User className="h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/saved">
                    <Heart className="h-4 w-4" /> Saved
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" variant="gradient">
                <Link href="/register">Get started</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>
                  <Logo href={null} />
                </SheetTitle>
              </SheetHeader>
              <form role="search" onSubmit={submitMobileSearch} className="relative mt-6">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={mobileQuery}
                  onChange={(e) => setMobileQuery(e.target.value)}
                  placeholder="Search cars — make or model"
                  aria-label="Search cars by make or model"
                  className="pl-9"
                />
              </form>
              <nav className="mt-6 flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-6 flex flex-col gap-2 border-t pt-6">
                <Button asChild variant="gradient" onClick={() => setOpen(false)}>
                  <Link href="/vehicles/new">
                    <Plus className="h-4 w-4" /> Sell / List a Vehicle
                  </Link>
                </Button>
                {!user && (
                  <>
                    <Button asChild variant="outline" onClick={() => setOpen(false)}>
                      <Link href="/login">Sign in</Link>
                    </Button>
                    <Button asChild variant="ghost" onClick={() => setOpen(false)}>
                      <Link href="/register">Create account</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
