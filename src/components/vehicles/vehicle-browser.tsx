"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Bookmark, X } from "lucide-react";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { ListingGrid } from "@/components/ui/listing-card";
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
import {
  Facet,
  FilterLayout,
  FilterOption,
  FilterOptionList,
  MultiFacet,
} from "@/components/shell/filter-dock";
import { Pagination } from "@/components/ui/pagination";
import { usePagedList } from "@/lib/use-paged-list";
import { POPULAR_BRANDS, BODY_TYPES, FUEL_TYPES, TRANSMISSIONS, GHANA_REGIONS } from "@/lib/constants";
import type { SampleVehicle } from "@/lib/sample-data";
import {
  type RangeBand,
  type VehicleFilters,
  type VehicleSort,
  EMPTY_FILTERS,
  PRICE_BANDS,
  YEAR_BANDS,
  activeBand,
  activeFilterCount,
  bandToRange,
  filtersToQuery,
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

  /**
   * How many results each option would leave, honouring every *other* active
   * filter.
   *
   * The number beside an option has to answer "how many if I pick this" —
   * measured against the unfiltered list it would promise cars that aren't
   * there. It is also what makes a plain list better than the dropdown it
   * replaces: a buyer can see that Kia has three and Toyota eighteen without
   * opening anything, and never picks a filter that returns nothing.
   */
  const counts = useMemo(() => {
    const facet = <T,>(
      ignore: keyof VehicleFilters | readonly (keyof VehicleFilters)[],
      options: readonly T[],
      key: (o: T) => string,
      test: (v: SampleVehicle, o: T) => boolean,
    ) => {
      const pool = vehicles.filter((v) => matchesFilters(v, filters, ignore));
      const out: Record<string, number> = { any: pool.length };
      for (const o of options) out[key(o)] = pool.filter((v) => test(v, o)).length;
      return out;
    };

    return {
      brand: facet("brand", POPULAR_BRANDS, (b) => b, (v, b) => v.brand === b),
      bodyType: facet("bodyType", BODY_TYPES, (b) => b.value, (v, b) => v.bodyType === b.value),
      condition: facet("condition", CONDITIONS, (c) => c.value, (v, c) => v.condition === c.value),
      fuelType: facet("fuelType", FUEL_TYPES, (f) => f.value, (v, f) => v.fuelType === f.value),
      transmission: facet(
        "transmission",
        TRANSMISSIONS,
        (t) => t.value,
        (v, t) => v.transmission === t.value,
      ),
      region: facet("region", GHANA_REGIONS, (r) => r, (v, r) => v.region === r),
      // Price and year are one choice spread over two fields, so both halves
      // have to be ignored or every band would report only what is already on
      // screen.
      price: facet(
        ["minPrice", "maxPrice"] as const,
        PRICE_BANDS,
        (b) => b.id,
        (v, b) => (b.min == null || v.price >= b.min) && (b.max == null || v.price <= b.max),
      ),
      year: facet(
        ["minYear", "maxYear"] as const,
        YEAR_BANDS,
        (b) => b.id,
        (v, b) => (b.min == null || v.year >= b.min) && (b.max == null || v.year <= b.max),
      ),
    };
  }, [vehicles, filters]);

  const priceBand = activeBand(PRICE_BANDS, filters.minPrice, filters.maxPrice);
  const yearBand = activeBand(YEAR_BANDS, filters.minYear, filters.maxYear);

  function setPriceBand(band: RangeBand | null) {
    const { min, max } = bandToRange(band);
    setFilters((f) => ({ ...f, minPrice: min, maxPrice: max }));
  }
  function setYearBand(band: RangeBand | null) {
    const { min, max } = bandToRange(band);
    setFilters((f) => ({ ...f, minYear: min, maxYear: max }));
  }

  const activeCount = activeFilterCount(filters);
  // The query string already changes on exactly the events that change the
  // result set, so it doubles as the signal to go back to page 1.
  const paged = usePagedList(filtered, query);

  /**
   * Every facet is the same shape: a heading, then its choices listed under it,
   * left aligned with the heading and with the count of what each would leave.
   *
   * No dropdowns. A select hides its options behind a click, gives no sense of
   * how much is inside, and — because the trigger is a bordered box the width
   * of the column — puts a hard rectangle between every heading and the next,
   * which is what made this sidebar feel busy next to the one calm list on it.
   * Long facets scroll inside their own window instead, so every heading stays
   * visible at once.
   *
   * Categorical facets take several answers; price and year take one, because
   * they are ranges and two disjoint bands is not a search anybody means.
   */
  const FilterPanel = (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Keyword</Label>
        <Input
          placeholder="e.g. Camry"
          value={filters.q}
          onChange={(e) => set("q", e.target.value)}
        />
      </div>

      <Facet label="Brand">
        <MultiFacet
          name="brand"
          anyLabel="Any brand"
          options={POPULAR_BRANDS.map((b) => ({ value: b, label: b }))}
          value={filters.brand}
          onChange={(v) => set("brand", v)}
          counts={counts.brand}
          maxRows={7}
        />
      </Facet>

      <Facet label="Body type">
        <MultiFacet
          name="bodyType"
          anyLabel="Any body type"
          options={BODY_TYPES}
          value={filters.bodyType}
          onChange={(v) => set("bodyType", v)}
          counts={counts.bodyType}
          maxRows={6}
        />
      </Facet>

      <Facet label="Price (GH₵)">
        <FilterOptionList>
          <FilterOption
            name="price"
            label="Any price"
            checked={!filters.minPrice && !filters.maxPrice}
            onSelect={() => setPriceBand(null)}
            count={counts.price.any}
          />
          {PRICE_BANDS.map((b) => (
            <FilterOption
              key={b.id}
              name="price"
              label={b.label}
              checked={priceBand?.id === b.id}
              onSelect={() => setPriceBand(b)}
              count={counts.price[b.id] ?? 0}
            />
          ))}
        </FilterOptionList>
      </Facet>

      <Facet label="Year">
        <FilterOptionList>
          <FilterOption
            name="year"
            label="Any year"
            checked={!filters.minYear && !filters.maxYear}
            onSelect={() => setYearBand(null)}
            count={counts.year.any}
          />
          {YEAR_BANDS.map((b) => (
            <FilterOption
              key={b.id}
              name="year"
              label={b.label}
              checked={yearBand?.id === b.id}
              onSelect={() => setYearBand(b)}
              count={counts.year[b.id] ?? 0}
            />
          ))}
        </FilterOptionList>
      </Facet>

      <Facet label="Condition">
        <MultiFacet
          name="condition"
          anyLabel="Any condition"
          options={CONDITIONS}
          value={filters.condition}
          onChange={(v) => set("condition", v)}
          counts={counts.condition}
        />
      </Facet>

      <Facet label="Fuel type">
        <MultiFacet
          name="fuelType"
          anyLabel="Any fuel"
          options={FUEL_TYPES}
          value={filters.fuelType}
          onChange={(v) => set("fuelType", v)}
          counts={counts.fuelType}
        />
      </Facet>

      <Facet label="Transmission">
        <MultiFacet
          name="transmission"
          anyLabel="Any transmission"
          options={TRANSMISSIONS}
          value={filters.transmission}
          onChange={(v) => set("transmission", v)}
          counts={counts.transmission}
        />
      </Facet>

      <Facet label="Region">
        <MultiFacet
          name="region"
          anyLabel="Any region"
          options={GHANA_REGIONS.map((r) => ({ value: r, label: r }))}
          value={filters.region}
          onChange={(v) => set("region", v)}
          counts={counts.region}
          maxRows={7}
        />
      </Facet>

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
          <ListingGrid className="mt-5">
            {paged.items.map((v) => (
              <VehicleCard key={v.id} vehicle={v} basePath={basePath} />
            ))}
          </ListingGrid>
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
