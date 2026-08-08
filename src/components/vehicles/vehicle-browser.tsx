"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Bookmark, X } from "lucide-react";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
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
import { FilterLayout, FilterOption, FilterOptionList } from "@/components/shell/filter-dock";
import { Pagination } from "@/components/ui/pagination";
import { usePagedList } from "@/lib/use-paged-list";
import { POPULAR_BRANDS, BODY_TYPES, FUEL_TYPES, TRANSMISSIONS, GHANA_REGIONS } from "@/lib/constants";
import type { SampleVehicle } from "@/lib/sample-data";
import {
  type VehicleFilters,
  type VehicleSort,
  EMPTY_FILTERS,
  filtersToQuery,
  activeFilterCount,
  matchesFilters,
} from "@/lib/vehicle-search";

const CONDITIONS = [
  { value: "NEW", label: "Brand New" },
  { value: "FOREIGN_USED", label: "Foreign Used" },
  { value: "GHANA_USED", label: "Ghana Used" },
];

export function VehicleBrowser({
  vehicles,
  initialFilters,
  initialSort = "relevance",
  basePath = "/vehicles",
}: {
  vehicles: SampleVehicle[];
  initialFilters?: Partial<VehicleFilters>;
  initialSort?: VehicleSort;
  /** Where result cards link. The Marketplace module keeps them in the shell. */
  basePath?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const [filters, setFilters] = useState<VehicleFilters>({ ...EMPTY_FILTERS, ...initialFilters });
  const [sort, setSort] = useState<VehicleSort>(initialSort);

  // Keep the URL in sync with the active search, so it's shareable by link and
  // can be captured as a Saved Search.
  const query = filtersToQuery(filters, sort);
  useEffect(() => {
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [query, pathname, router]);

  function set<K extends keyof VehicleFilters>(key: K, value: VehicleFilters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
  }
  function reset() {
    setFilters(EMPTY_FILTERS);
  }

  async function saveSearch() {
    if (status !== "authenticated") {
      toast.info("Sign in to save this search");
      return;
    }
    const name = window.prompt("Name this search", "My search")?.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, query }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not save the search");
        return;
      }
      toast.success("Search saved — find it under Saved Searches.");
    } catch {
      toast.error("Something went wrong");
    }
  }

  const filtered = useMemo(() => {
    let result = vehicles.filter((v) => matchesFilters(v, filters));
    switch (sort) {
      case "price-asc":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "year-desc":
        result = [...result].sort((a, b) => b.year - a.year);
        break;
      case "mileage-asc":
        result = [...result].sort((a, b) => a.mileage - b.mileage);
        break;
    }
    return result;
  }, [vehicles, filters, sort]);

  // What each condition would leave, honouring every other active filter. The
  // count beside an option has to answer "how many if I pick this" — measured
  // against the unfiltered list it would promise cars that aren't there.
  const conditionCounts = useMemo(() => {
    const pool = vehicles.filter((v) => matchesFilters(v, filters, "condition"));
    const counts: Record<string, number> = { any: pool.length };
    for (const c of CONDITIONS) counts[c.value] = pool.filter((v) => v.condition === c.value).length;
    return counts;
  }, [vehicles, filters]);

  const activeCount = activeFilterCount(filters);
  // The query string already changes on exactly the events that change the
  // result set, so it doubles as the signal to go back to page 1.
  const paged = usePagedList(filtered, query);

  const FilterPanel = (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Keyword</Label>
        <Input
          placeholder="e.g. Camry"
          value={filters.q}
          onChange={(e) => set("q", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Brand</Label>
        <Select value={filters.brand || "any"} onValueChange={(v) => set("brand", v === "any" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any brand</SelectItem>
            {POPULAR_BRANDS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Body type</Label>
        <Select
          value={filters.bodyType || "any"}
          onValueChange={(v) => set("bodyType", v === "any" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any body type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any body type</SelectItem>
            {BODY_TYPES.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Price range (GHS)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => set("minPrice", e.target.value)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => set("maxPrice", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Year range</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="From"
            value={filters.minYear}
            onChange={(e) => set("minYear", e.target.value)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder="To"
            value={filters.maxYear}
            onChange={(e) => set("maxYear", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Condition</Label>
        <FilterOptionList>
          <FilterOption
            name="condition"
            label="Any condition"
            checked={filters.condition === ""}
            onSelect={() => set("condition", "")}
            count={conditionCounts.any}
          />
          {CONDITIONS.map((c) => (
            <FilterOption
              key={c.value}
              name="condition"
              label={c.label}
              checked={filters.condition === c.value}
              onSelect={() => set("condition", c.value)}
              count={conditionCounts[c.value] ?? 0}
            />
          ))}
        </FilterOptionList>
      </div>
      <div className="space-y-2">
        <Label>Fuel type</Label>
        <Select
          value={filters.fuelType || "any"}
          onValueChange={(v) => set("fuelType", v === "any" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any fuel</SelectItem>
            {FUEL_TYPES.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Transmission</Label>
        <Select
          value={filters.transmission || "any"}
          onValueChange={(v) => set("transmission", v === "any" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            {TRANSMISSIONS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Region</Label>
        <Select
          value={filters.region || "any"}
          onValueChange={(v) => set("region", v === "any" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any region</SelectItem>
            {GHANA_REGIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" className="w-full" onClick={reset}>
        <X className="h-4 w-4" /> Clear filters
      </Button>
    </div>
  );

  return (
    <FilterLayout filters={FilterPanel} activeCount={activeCount}>
      <div ref={paged.anchorRef} className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span> vehicles found
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={saveSearch}>
            <Bookmark className="h-4 w-4" /> Save search
          </Button>
          <Select value={sort} onValueChange={(v) => setSort(v as VehicleSort)}>
            <SelectTrigger className="h-9 w-[150px] sm:w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Most relevant</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="year-desc">Newest year</SelectItem>
              <SelectItem value="mileage-asc">Lowest mileage</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <p className="font-semibold">No vehicles match your filters</p>
          <p className="mt-1 text-sm text-muted-foreground">Try widening your search.</p>
          <Button variant="outline" className="mt-4" onClick={reset}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paged.items.map((v) => (
              <VehicleCard key={v.id} vehicle={v} basePath={basePath} />
            ))}
          </div>
          <Pagination
            page={paged.page}
            pageCount={paged.pageCount}
            onPageChange={paged.goToPage}
            itemNoun="vehicle"
            from={paged.from}
            to={paged.to}
            total={paged.total}
          />
        </>
      )}
    </FilterLayout>
  );
}
