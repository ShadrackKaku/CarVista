"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu, Search } from "lucide-react";
import { pageMetaFor } from "@/lib/page-meta";
import type { UserRole } from "@prisma/client";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { ModuleSidebar } from "@/components/shell/module-sidebar";
import { openCommandPalette } from "@/lib/ui-events";

export interface ShellTopbarProps {
  role: UserRole;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
  unreadMessages: number;
}

/**
 * Sits above the scrolling content column rather than inside it, so it stays
 * visible without needing `sticky`. Account controls live in the sidebar's
 * footer, so this only carries navigation and search.
 */
export function ShellTopbar({
  role,
  userName,
  userEmail,
  userImage,
  unreadMessages,
}: ShellTopbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  // Resolved during render — including on the server — so the title is present
  // in the first paint rather than filled in by an effect.
  const meta = pageMetaFor(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-card px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          className="-ml-1 shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {meta && (
          <div className="min-w-0">
            <h1 className="truncate font-display text-base font-bold leading-tight tracking-tight sm:text-lg">
              {meta.title}
            </h1>
            {meta.subtitle && (
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                {meta.subtitle}
              </p>
            )}
          </div>
        )}

        {role === "ADMIN" && (
          <Badge variant="brand" className="hidden shrink-0 lg:inline-flex">
            Admin
          </Badge>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* A button dressed as a field: one search surface, not two. */}
        <button
          type="button"
          onClick={openCommandPalette}
          className="hidden items-center gap-2.5 rounded-xl border bg-background px-3.5 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:flex md:w-52 lg:w-64 xl:w-80"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          onClick={openCommandPalette}
          aria-label="Search"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
        >
          <Search className="h-5 w-5" />
        </button>

        <ThemeToggle />

        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Home className="h-4 w-4" />
          <span className="hidden md:inline">Back to site</span>
        </Link>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-[17rem] border-none p-0 sm:max-w-[17rem]">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {/* Both sidebars stack here: on a phone there is no room for a third
              column, but the module's own nav still has to be reachable. */}
          <div className="flex h-full flex-col overflow-hidden">
            <ModuleSidebar
              role={role}
              variant="drawer"
              onNavigate={() => setDrawerOpen(false)}
            />
            <div className="min-h-0 flex-1">
              <AppSidebar
                role={role}
                userName={userName}
                userEmail={userEmail}
                userImage={userImage}
                unreadMessages={unreadMessages}
                variant="drawer"
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
