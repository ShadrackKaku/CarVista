"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { CommandPalette } from "@/components/shell/command-palette";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        {/* Mounted once, opened from anywhere via src/lib/ui-events. */}
        <AuthDialog />
        <CommandPalette />
        <Toaster position="top-right" richColors closeButton />
      </NextThemesProvider>
    </SessionProvider>
  );
}
