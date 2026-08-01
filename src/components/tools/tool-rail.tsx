"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { TOOLS } from "@/lib/tools";
import { cn } from "@/lib/utils";

/**
 * The workspace rail. Every tool stays one click away, and switching between
 * them swaps only the content column — the same in-page feel as the
 * dashboards, rather than a full page change per calculator.
 */
export function ToolRail() {
  const pathname = usePathname();

  return (
    <nav aria-label="Tools" className="lg:sticky lg:top-24">
      {/* Mobile: a horizontal scroller so the rail costs no vertical space. */}
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
        <RailLink
          href="/calculators"
          label="All tools"
          icon={LayoutGrid}
          active={pathname === "/calculators"}
        />
        {TOOLS.map((tool) => (
          <RailLink
            key={tool.id}
            href={tool.href}
            label={tool.short}
            icon={tool.icon}
            active={pathname === tool.href}
            soon={tool.status === "SOON"}
          />
        ))}
      </div>
    </nav>
  );
}

function RailLink({
  href,
  label,
  icon: Icon,
  active,
  soon = false,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  soon?: boolean;
}) {
  const base =
    "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap lg:w-full lg:whitespace-normal";

  if (soon) {
    return (
      <span aria-disabled className={cn(base, "cursor-default text-muted-foreground/50")}>
        <Icon className="h-[18px] w-[18px] shrink-0" />
        <span className="flex-1">{label}</span>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          Soon
        </span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        base,
        active
          ? "bg-brand-600/10 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="flex-1">{label}</span>
    </Link>
  );
}
