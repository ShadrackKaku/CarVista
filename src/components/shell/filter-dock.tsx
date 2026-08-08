"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usesFilterDock } from "@/lib/modules";
import { cn } from "@/lib/utils";

/**
 * Where a browse page's filters live inside the shell.
 *
 * The module's own navigation used to hold this column, which left three
 * navigation panels stacked left-to-right before any content: the brand rail,
 * the module nav, and the page's own filter sidebar. Two of those three were
 * navigation the user was not currently using. The module nav moved into a
 * flyout off the rail, and filters — the one panel you actually operate while
 * reading results — took the fixed column it left behind.
 */
const DOCK_BODY_ID = "shell-filter-dock-body";

/**
 * The column itself, rendered by the shell.
 *
 * It decides from the pathname, during the server render, whether this route
 * has filters — so the column is in the first paint at its real width and the
 * results grid never reflows once the page's filters portal in.
 *
 * The heading is rendered here rather than portalled for the same reason: for
 * the frame between hydration and the portal landing, the column reads as an
 * empty filter panel rather than as a broken one.
 */
export function FilterDock() {
  const pathname = usePathname();
  const bodyRef = useRef<HTMLDivElement>(null);
  // Optimistic, and deliberately so: it matches the server render, so the
  // column is at its real width in the first paint and the results never
  // reflow. Only the rare browse page with nothing at all to filter — an empty
  // supplier directory on launch day — ever flips it off.
  const [filled, setFilled] = useState(true);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const sync = () => setFilled(body.childElementCount > 0);
    // One frame's grace: the page's portal lands just after this effect runs,
    // so checking immediately would collapse a column that is about to fill.
    const raf = requestAnimationFrame(sync);
    const observer = new MutationObserver(sync);
    observer.observe(body, { childList: true });
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [pathname]);

  if (!usesFilterDock(pathname)) return null;

  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 flex-col bg-card lg:flex",
        // Narrower at lg, where three cards have to fit in what is left, and
        // wider from xl where there is room for both.
        filled ? "w-64 border-r xl:w-72" : "w-0 overflow-hidden border-0",
      )}
      // A collapsed dock is not just narrow, it is absent: leaving the heading
      // reachable would announce a filter panel that has no filters.
      aria-hidden={!filled}
    >
      <div className="shrink-0 px-5 pb-4 pt-5">
        <p className="flex items-center gap-2 font-display text-base font-bold tracking-tight">
          <SlidersHorizontal className="h-[18px] w-[18px] text-brand-600" />
          Filters
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Narrow the list. Results update as you choose.
        </p>
      </div>
      {/* Its own scroll region: a long filter panel must never scroll the
          results beside it, nor be cut off by them. */}
      <div
        id={DOCK_BODY_ID}
        ref={bodyRef}
        className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6"
      />
    </aside>
  );
}

/**
 * The page half: puts `filters` wherever this route keeps them, and lays out
 * `children` beside them.
 *
 * Docked routes portal into the shell column. Everything else — the public
 * marketing twins at `/vehicles`, `/parts` and friends, which have no shell to
 * dock into — keeps the inline sticky sidebar it has always had. Both cases
 * share one filter panel and one mobile sheet, so the two surfaces cannot drift.
 */
export function FilterLayout({
  filters,
  children,
  activeCount = 0,
  className,
}: {
  filters: React.ReactNode;
  children: React.ReactNode;
  /** Shown on the mobile trigger, so a collapsed panel still declares itself. */
  activeCount?: number;
  className?: string;
}) {
  const pathname = usePathname();
  const docked = usesFilterDock(pathname);
  const [host, setHost] = useState<HTMLElement | null>(null);

  // The dock is committed to the DOM in the same pass that renders this page,
  // so by the time effects run it is there to be found. Re-resolved per route
  // because navigating between two docked pages remounts the column.
  useEffect(() => {
    if (!docked) {
      setHost(null);
      return;
    }
    setHost(document.getElementById(DOCK_BODY_ID));
  }, [docked, pathname]);

  const mobile = <MobileFilters activeCount={activeCount}>{filters}</MobileFilters>;

  if (docked) {
    return (
      <>
        {host && createPortal(filters, host)}
        <div className={cn("min-w-0", className)}>
          {mobile}
          {children}
        </div>
      </>
    );
  }

  return (
    <div className={cn("grid gap-8 lg:grid-cols-[280px_1fr]", className)}>
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-xl border bg-card p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </h2>
          {filters}
        </div>
      </aside>
      {/* min-w-0 so the results column can shrink below its content's intrinsic
          width — without it the toolbar row sizes the grid track and pushes the
          whole page sideways on small screens. */}
      <div className="min-w-0">
        {mobile}
        {children}
      </div>
    </div>
  );
}

/**
 * One row of a filter's options: control on the left, label beside it, count on
 * the right, everything flush to the same left edge.
 *
 * A dropdown hides its options until you open it, which is the right trade when
 * a list is long (sixteen regions, forty brands) and the wrong one when it is
 * short. Condition has three values — putting them behind a click meant you had
 * to open a menu to learn what the choices even were.
 *
 * Single-select by default, because that is what these facets are. They were
 * checkboxes that behaved like radios, which tells the user they can pick two
 * and then silently refuses.
 */
export function FilterOption({
  name,
  checked,
  onSelect,
  label,
  count,
  multiple = false,
}: {
  /** Groups the radios, so the browser enforces one-of-many for us. */
  name: string;
  checked: boolean;
  onSelect: () => void;
  label: string;
  /** How many results this option would leave. Omit when it isn't known. */
  count?: number;
  multiple?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-2 text-sm transition-colors",
        checked
          ? "font-medium text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <input
        type={multiple ? "checkbox" : "radio"}
        name={name}
        checked={checked}
        onChange={onSelect}
        className="h-4 w-4 shrink-0 accent-brand-600"
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{count}</span>
      )}
    </label>
  );
}

/** The rows pulled back to the panel's edge, so controls line up with labels. */
export function FilterOptionList({ children }: { children: React.ReactNode }) {
  return <div className="-mx-1.5 flex flex-col">{children}</div>;
}

/** Below `lg` there is no room for a column, so the same panel opens in a sheet. */
function MobileFilters({
  activeCount,
  children,
}: {
  activeCount: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {activeCount > 0 && (
              <span className="ml-1 rounded-full bg-brand-600 px-1.5 text-[10px] text-white">
                {activeCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85%] overflow-y-auto sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-6">{children}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
