"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CornerDownLeft, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { navigationFor, type NavItem } from "@/lib/navigation";
import { OPEN_COMMAND_PALETTE } from "@/lib/ui-events";

interface Entry {
  item: NavItem;
  section: string;
}

/** All terms an entry can be matched on, lowercased once per render. */
function haystack(entry: Entry): string {
  return [entry.item.label, entry.section, entry.item.description, ...(entry.item.keywords ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/**
 * ⌘K. Indexes the same navigation tree the sidebar renders, so a destination
 * is reachable by name from anywhere without hunting for it — and falls
 * through to full site search when the query isn't a destination.
 */
export function CommandPalette() {
  const router = useRouter();
  const { data: session } = useSession();
  const role = session?.user?.role ?? null;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const entries = useMemo<Entry[]>(
    () =>
      navigationFor(role).flatMap((section) =>
        section.items
          .filter((item) => !item.soon)
          .map((item) => ({ item, section: section.label })),
      ),
    [role],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries.slice(0, 8);
    const terms = q.split(/\s+/);
    return entries
      .filter((entry) => {
        const hay = haystack(entry);
        return terms.every((term) => hay.includes(term));
      })
      .slice(0, 10);
  }, [entries, query]);

  const trimmed = query.trim();
  // The last row always offers full site search, so a query that matches no
  // destination is never a dead end.
  const searchRowIndex = trimmed ? results.length : -1;
  const rowCount = results.length + (trimmed ? 1 : 0);

  useEffect(() => {
    function onOpen() {
      setQuery("");
      setCursor(0);
      setOpen(true);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpen();
      }
    }
    window.addEventListener(OPEN_COMMAND_PALETTE, onOpen);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener(OPEN_COMMAND_PALETTE, onOpen);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Keep the cursor inside the list as the query narrows it.
  useEffect(() => {
    setCursor((c) => (rowCount === 0 ? 0 : Math.min(c, rowCount - 1)));
  }, [rowCount]);

  const go = useCallback(
    (index: number) => {
      if (index === searchRowIndex) {
        router.push(`/app/search?q=${encodeURIComponent(trimmed)}`);
      } else {
        const entry = results[index];
        if (!entry) return;
        router.push(entry.item.href);
      }
      setOpen(false);
    },
    [results, router, searchRowIndex, trimmed],
  );

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (rowCount === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (c + 1) % rowCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c - 1 + rowCount) % rowCount);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(cursor);
    }
  }

  // Follow the cursor when it walks past the visible area.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${cursor}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* The dialog's own close button would land on top of the search field,
          so it is hidden here — Escape and the overlay both still close. */}
      <DialogContent className="top-[15%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0 [&>button:last-of-type]:hidden">
        <DialogTitle className="sr-only">Search CarVista</DialogTitle>

        <div className="flex items-center gap-3 border-b px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Search pages, tools, cars, parts…"
            aria-label="Search CarVista"
            className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden shrink-0 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
            esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[22rem] overflow-y-auto p-2">
          {rowCount === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Nothing matches “{trimmed}”.
            </p>
          )}

          {results.map((entry, index) => {
            const Icon = entry.item.icon;
            return (
              <button
                key={`${entry.section}:${entry.item.href}`}
                type="button"
                data-index={index}
                onMouseEnter={() => setCursor(index)}
                onClick={() => go(index)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  cursor === index ? "bg-accent text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">
                    {entry.item.label}
                  </span>
                  {entry.item.description && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {entry.item.description}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground/70">
                  {entry.section}
                </span>
              </button>
            );
          })}

          {trimmed && (
            <button
              type="button"
              data-index={searchRowIndex}
              onMouseEnter={() => setCursor(searchRowIndex)}
              onClick={() => go(searchRowIndex)}
              className={cn(
                "mt-1 flex w-full items-center gap-3 rounded-lg border-t px-3 py-2.5 text-left text-sm transition-colors",
                cursor === searchRowIndex ? "bg-accent text-foreground" : "text-muted-foreground",
              )}
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">
                Search the whole site for{" "}
                <span className="font-medium text-foreground">“{trimmed}”</span>
              </span>
              <CornerDownLeft className="h-3.5 w-3.5 shrink-0" />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
