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

/** Quick make shortcuts shown beneath the search box. */
const POPULAR_MAKES = ["Toyota", "Honda", "Hyundai", "Kia", "Nissan", "Mercedes-Benz"];

/**
 * Nav-bar search: opens a command-palette-style dialog so buyers can type a
 * make/model and jump straight to matching cars — no need to land on the
 * listings page first and reach for the filter panel. The query is handed to
 * `/vehicles?q=…`, which runs the same server-side search the filters use, so
 * the result is a normal, shareable, refine-able listings URL.
 */
export function NavSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  function go(term?: string) {
    const value = (term ?? q).trim();
    setOpen(false);
    setQ("");
    router.push(value ? `/vehicles?q=${encodeURIComponent(value)}` : "/vehicles");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:inline-flex"
          aria-label="Search cars"
        >
          <Search className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="top-[12%] max-w-xl translate-y-0 gap-0 p-0 sm:rounded-2xl">
        <DialogTitle className="sr-only">Search cars</DialogTitle>
        <DialogDescription className="sr-only">
          Type a make or model and press Enter to see matching cars.
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
            placeholder="Search cars by make or model — e.g. “Toyota Camry”"
            aria-label="Search cars by make or model"
            className="h-14 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button type="submit" size="sm" variant="gradient" className="shrink-0">
            Search
          </Button>
        </form>
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="text-xs font-medium text-muted-foreground">Popular:</span>
          {POPULAR_MAKES.map((make) => (
            <button
              key={make}
              type="button"
              onClick={() => go(make)}
              className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {make}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
