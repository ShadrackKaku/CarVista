"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { PartCard } from "@/components/parts/part-card";
import { ListingGrid } from "@/components/ui/listing-card";
import { Facet, FilterLayout, MultiFacet } from "@/components/shell/filter-dock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { matchesAny, matchesAnyOf, selectedValues } from "@/lib/multi-select";
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
      if (!matchesAny(category, p.categorySlug)) return false;
      // A part lists every make it fits, so the buyer's chosen makes and the
      // part's own list only have to overlap somewhere.
      if (!matchesAnyOf(make, p.compatibleMakes)) return false;
      if (oem && p.oemNumber && !p.oemNumber.toLowerCase().includes(oem.toLowerCase())) return false;
      if (oem && !p.oemNumber) return false;
      return true;
    });
    if (sort === "price-asc") result = [...result].sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
    if (sort === "price-desc") result = [...result].sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
    if (sort === "rating") result = [...result].sort((a, b) => b.rating - a.rating);
    return result;
  }, [parts, q, category, make, oem, sort]);

  /**
   * What each option would leave, honouring every other active filter — the
   * same contract as the vehicle browser, so a number means the same thing
   * wherever it appears on the platform.
   */
  const counts = useMemo(() => {
    const pool = (ignore: "category" | "make") =>
      parts.filter((p) => {
        if (q && !`${p.name} ${p.brand}`.toLowerCase().includes(q.toLowerCase())) return false;
        if (ignore !== "category" && !matchesAny(category, p.categorySlug)) return false;
        if (ignore !== "make" && !matchesAnyOf(make, p.compatibleMakes)) return false;
        if (oem && !p.oemNumber?.toLowerCase().includes(oem.toLowerCase())) return false;
        return true;
      });

    const byCategory = pool("category");
    const byMake = pool("make");
    return {
      category: {
        any: byCategory.length,
        ...Object.fromEntries(
          PART_CATEGORIES.map((c) => [c.slug, byCategory.filter((p) => p.categorySlug === c.slug).length]),
        ),
      },
      make: {
        any: byMake.length,
        ...Object.fromEntries(
          POPULAR_BRANDS.map((b) => [b, byMake.filter((p) => p.compatibleMakes.includes(b)).length]),
        ),
      },
    };
  }, [parts, q, category, make, oem]);

  function reset() {
    setQ("");
    setCategory("");
    setMake("");
    setOem("");
  }

  // Each ticked value is one filter, matching how the vehicle browser counts.
  const activeCount =
    [q, oem].filter(Boolean).length + selectedValues(category).length + selectedValues(make).length;
  const paged = usePagedList(filtered, `${q}|${category}|${make}|${oem}`);

  const FilterPanel = (
    <div className="space-y-6">
      <Facet label="Keyword">
        <Input placeholder="e.g. brake pad" value={q} onChange={(e) => setQ(e.target.value)} />
      </Facet>

      <Facet label="Vehicle make">
        <MultiFacet
          name="make"
          anyLabel="Any make"
          options={POPULAR_BRANDS.map((b) => ({ value: b, label: b }))}
          value={make}
          onChange={setMake}
          counts={counts.make}
          maxRows={7}
        />
      </Facet>

      <Facet label="Category">
        <MultiFacet
          name="category"
          anyLabel="Any category"
          options={PART_CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))}
          value={category}
          onChange={setCategory}
          counts={counts.category}
          maxRows={7}
        />
      </Facet>

      <Facet label="OEM / Part number">
        <Input
          placeholder="e.g. 04465-02220"
          value={oem}
          onChange={(e) => setOem(e.target.value)}
        />
      </Facet>

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
          <ListingGrid className="mt-5">
            {paged.items.map((p) => (
              <PartCard key={p.id} part={p} basePath={basePath} />
            ))}
          </ListingGrid>
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
