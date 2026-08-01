"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { PartCard } from "@/components/parts/part-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PART_CATEGORIES, POPULAR_BRANDS } from "@/lib/constants";
import type { SamplePart } from "@/lib/sample-data";

export function PartsBrowser({
  parts,
  initialCategory = "",
  basePath = "/parts",
}: {
  parts: SamplePart[];
  initialCategory?: string;
  /** Where result cards link. The Marketplace module keeps them in the shell. */
  basePath?: string;
}) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [make, setMake] = useState("");
  const [oem, setOem] = useState("");
  const [sort, setSort] = useState("relevance");

  const filtered = useMemo(() => {
    let result = parts.filter((p) => {
      if (q && !`${p.name} ${p.brand}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (category && p.categorySlug !== category) return false;
      if (make && !p.compatibleMakes.includes(make)) return false;
      if (oem && p.oemNumber && !p.oemNumber.toLowerCase().includes(oem.toLowerCase())) return false;
      if (oem && !p.oemNumber) return false;
      return true;
    });
    if (sort === "price-asc") result = [...result].sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
    if (sort === "price-desc") result = [...result].sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
    if (sort === "rating") result = [...result].sort((a, b) => b.rating - a.rating);
    return result;
  }, [parts, q, category, make, oem, sort]);

  function reset() {
    setQ("");
    setCategory("");
    setMake("");
    setOem("");
  }

  return (
    <div>
      {/* Fitment search bar */}
      <div className="rounded-2xl border bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Search className="h-4 w-4 text-brand-500" /> Find the right part
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Vehicle make</Label>
            <Select value={make || "any"} onValueChange={(v) => setMake(v === "any" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Any make" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any make</SelectItem>
                {POPULAR_BRANDS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={category || "any"} onValueChange={(v) => setCategory(v === "any" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Any category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any category</SelectItem>
                {PART_CATEGORIES.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">OEM / Part number</Label>
            <Input placeholder="e.g. 04465-02220" value={oem} onChange={(e) => setOem(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Keyword</Label>
            <Input placeholder="e.g. brake pad" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategory("")}
          className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition-colors ${
            category === "" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30" : "hover:bg-accent"
          }`}
        >
          All parts
        </button>
        {PART_CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => setCategory(c.slug)}
            className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition-colors ${
              category === c.slug
                ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30"
                : "hover:bg-accent"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span> parts found
        </p>
        <div className="flex items-center gap-2">
          {(q || category || make || oem) && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <X className="h-4 w-4" /> Clear
            </Button>
          )}
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9 w-[160px]">
              <SlidersHorizontal className="mr-1 h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="rating">Top rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 flex flex-col items-center rounded-xl border border-dashed py-16 text-center">
          <p className="font-semibold">No parts match your search</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different make or category.</p>
          <Button variant="outline" className="mt-4" onClick={reset}>
            Clear search
          </Button>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <PartCard key={p.id} part={p} basePath={basePath} />
          ))}
        </div>
      )}
    </div>
  );
}
