import { redirect } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard");

  return (
    <div className="flex min-h-screen bg-muted/20">
      <DashboardSidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/85 px-5 backdrop-blur-lg">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <Home className="h-4 w-4" /> Back to site
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Avatar className="h-9 w-9 border">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
