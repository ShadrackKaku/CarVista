"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Quick search shortcuts shown beneath the search box. */
const POPULAR_SEARCHES = ["Toyota", "Honda", "Hyundai", "Brake pads", "Tyres", "Car service"];

/**
 * Nav-bar master search: opens a command-palette-style dialog so users can type
 * anything and jump straight to the site-wide results page — no need to land on
 * a listings page first and reach for a filter panel. The query is handed to
 * `/search?q=…`, which ranks matches across cars, parts, services, dealers and
 * articles, each linking through to its own detail page.
 */
export function NavSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  function go(term?: string) {
    const value = (term ?? q).trim();
    setOpen(false);
    setQ("");
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:inline-flex"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="top-[12%] max-w-xl translate-y-0 gap-0 p-0 sm:rounded-2xl">
        <DialogTitle className="sr-only">Search CarVista</DialogTitle>
        <DialogDescription className="sr-only">
          Search across cars, parts, services and dealers. Type a query and press Enter to see
          results.
        </DialogDescription>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            go();
          }}
          className="flex items-center gap-2 border-b px-4"
        >
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search cars, parts, services… — e.g. “Toyota Camry”"
            aria-label="Search cars, parts, services and dealers"
            className="h-14 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button type="submit" size="sm" variant="gradient" className="shrink-0">
            Search
          </Button>
        </form>
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="text-xs font-medium text-muted-foreground">Popular:</span>
          {POPULAR_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => go(term)}
              className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {term}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
