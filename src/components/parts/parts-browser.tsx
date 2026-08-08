"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { PartCard } from "@/components/parts/part-card";
import { FilterLayout } from "@/components/shell/filter-dock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PART_CATEGORIES, POPULAR_BRANDS } from "@/lib/constants";
import { usePagedList } from "@/lib/use-paged-list";
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

  const activeCount = [q, category, make, oem].filter(Boolean).length;
  const paged = usePagedList(filtered, `${q}|${category}|${make}|${oem}`);

  const FilterPanel = (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Vehicle make</Label>
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

      <div className="space-y-2">
        <Label>Category</Label>
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

      <div className="space-y-2">
        <Label>OEM / Part number</Label>
        <Input
          placeholder="e.g. 04465-02220"
          value={oem}
          onChange={(e) => setOem(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Keyword</Label>
        <Input placeholder="e.g. brake pad" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {activeCount > 0 && (
        <Button variant="outline" className="w-full" onClick={reset}>
          <X className="h-4 w-4" /> Clear filters
        </Button>
      )}
    </div>
  );

  return (
    <FilterLayout filters={FilterPanel} activeCount={activeCount}>
      <div ref={paged.anchorRef} className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span> parts found
        </p>
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

      {filtered.length === 0 ? (
        <div className="mt-16 flex flex-col items-center rounded-xl border border-dashed py-16 text-center">
          <p className="font-semibold">No parts match your search</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different make or category.</p>
          <Button variant="outline" className="mt-4" onClick={reset}>
            Clear search
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {paged.items.map((p) => (
              <PartCard key={p.id} part={p} basePath={basePath} />
            ))}
          </div>
          <Pagination
            page={paged.page}
            pageCount={paged.pageCount}
            onPageChange={paged.goToPage}
            itemNoun="part"
            from={paged.from}
            to={paged.to}
            total={paged.total}
          />
        </>
      )}
    </FilterLayout>
  );
}
