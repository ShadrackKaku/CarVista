"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { pageNumbers } from "@/lib/pagination";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** "Showing 19–36 of 54 vehicles" — the noun, singular. */
  itemNoun?: string;
  from?: number;
  to?: number;
  total?: number;
  className?: string;
}

/**
 * The control under a listing grid.
 *
 * Renders nothing at a single page: a "1 of 1" pager is chrome that answers a
 * question nobody asked, and it would sit under every short result set on the
 * site.
 */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  itemNoun = "result",
  from,
  to,
  total,
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null;

  const numbers = pageNumbers(page, pageCount);
  const go = (next: number) => {
    if (next >= 1 && next <= pageCount && next !== page) onPageChange(next);
  };

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "mt-8 flex flex-col-reverse items-center justify-between gap-4 border-t pt-6 sm:flex-row",
        className,
      )}
    >
      {total !== undefined && from !== undefined && to !== undefined ? (
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{from}</span>–
          <span className="font-semibold text-foreground">{to}</span> of{" "}
          <span className="font-semibold text-foreground">{total}</span>{" "}
          {total === 1 ? itemNoun : `${itemNoun}s`}
        </p>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-1">
        <Step
          direction="previous"
          disabled={page === 1}
          onClick={() => go(page - 1)}
        />

        {numbers.map((n, i) =>
          n === "gap" ? (
            // Presentational: a screen reader announcing "ellipsis" between
            // page numbers adds noise, not information.
            <span
              key={`gap-${i}`}
              aria-hidden
              className="px-1.5 text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => go(n)}
              aria-label={`Page ${n}`}
              aria-current={n === page ? "page" : undefined}
              className={cn(
                "h-9 min-w-[2.25rem] rounded-lg px-2.5 text-sm font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                n === page
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {n}
            </button>
          ),
        )}

        <Step direction="next" disabled={page === pageCount} onClick={() => go(page + 1)} />
      </div>
    </nav>
  );
}

function Step({
  direction,
  disabled,
  onClick,
}: {
  direction: "previous" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${direction === "previous" ? "Previous" : "Next"} page`}
      className={cn(
        "flex h-9 items-center gap-1 rounded-lg px-2.5 text-sm font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-40",
        "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {direction === "previous" && <Icon className="h-4 w-4" />}
      <span className="hidden sm:inline">{direction === "previous" ? "Previous" : "Next"}</span>
      {direction === "next" && <Icon className="h-4 w-4" />}
    </button>
  );
}
