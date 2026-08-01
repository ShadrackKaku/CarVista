"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Menu, Search } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/shell/app-sidebar";
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

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-card px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        {role === "ADMIN" && <Badge variant="brand">Admin</Badge>}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* A button dressed as a field: one search surface, not two. */}
        <button
          type="button"
          onClick={openCommandPalette}
          className="hidden items-center gap-2.5 rounded-xl border bg-background px-3.5 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:flex sm:w-64 lg:w-80"
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
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:hidden"
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
          <AppSidebar
            role={role}
            userName={userName}
            userEmail={userEmail}
            userImage={userImage}
            unreadMessages={unreadMessages}
            variant="drawer"
            onNavigate={() => setDrawerOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </header>
  );
}
