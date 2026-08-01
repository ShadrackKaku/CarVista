"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Menu, Search } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { openCommandPalette } from "@/lib/ui-events";
import { getInitials } from "@/lib/utils";

export interface ShellTopbarProps {
  role: UserRole;
  userName: string | null;
  userImage: string | null;
  unreadMessages: number;
}

export function ShellTopbar({ role, userName, userImage, unreadMessages }: ShellTopbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur-lg sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Back to site</span>
        </Link>

        {role === "ADMIN" && <Badge variant="brand">Admin</Badge>}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={openCommandPalette}
          aria-label="Search"
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
        >
          <Search className="h-4 w-4" />
        </button>
        <ThemeToggle />
        <Avatar className="h-9 w-9 border">
          <AvatarImage src={userImage ?? undefined} alt={userName ?? "Account"} />
          <AvatarFallback>{getInitials(userName)}</AvatarFallback>
        </Avatar>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-72 p-0 sm:max-w-72">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <AppSidebar
            role={role}
            unreadMessages={unreadMessages}
            variant="drawer"
            onNavigate={() => setDrawerOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </header>
  );
}
