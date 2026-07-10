import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center hero-gradient">
      <Logo />
      <p className="mt-10 font-display text-7xl font-extrabold text-gradient">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you're looking for doesn't exist or may have been moved. Let's get you back on the
        road.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="gradient">
          <Link href="/">
            <Home className="h-4 w-4" /> Back home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/vehicles">
            <Search className="h-4 w-4" /> Browse vehicles
          </Link>
        </Button>
      </div>
    </div>
  );
}
