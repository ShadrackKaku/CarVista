"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { POPULAR_BRANDS, BODY_TYPES, FUEL_TYPES, TRANSMISSIONS, GHANA_REGIONS } from "@/lib/constants";
import { formatCurrency, cn } from "@/lib/utils";
import type { SampleVehicle } from "@/lib/sample-data";

interface Filters {
  q: string;
  brand: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  condition: string;
  region: string;
  minPrice: string;
  maxPrice: string;
  minYear: string;
  maxYear: string;
}

const EMPTY: Filters = {
  q: "",
  brand: "",
  bodyType: "",
  fuelType: "",
  transmission: "",
  condition: "",
  region: "",
  minPrice: "",
  maxPrice: "",
  minYear: "",
  maxYear: "",
};

const CONDITIONS = [
  { value: "NEW", label: "Brand New" },
  { value: "FOREIGN_USED", label: "Foreign Used" },
  { value: "GHANA_USED", label: "Ghana Used" },
];

export function VehicleBrowser({
  vehicles,
  initial,
}: {
  vehicles: SampleVehicle[];
  initial?: Partial<Filters>;
}) {
  const [filters, setFilters] = useState<Filters>({ ...EMPTY, ...initial });
  const [sort, setSort] = useState("relevance");

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
  }
  function reset() {
    setFilters(EMPTY);
  }

  const filtered = useMemo(() => {
    let result = vehicles.filter((v) => {
      if (filters.q && !`${v.title} ${v.brand} ${v.model}`.toLowerCase().includes(filters.q.toLowerCase()))
        return false;
      if (filters.brand && v.brand !== filters.brand) return false;
      if (filters.bodyType && v.bodyType !== filters.bodyType) return false;
      if (filters.fuelType && v.fuelType !== filters.fuelType) return false;
      if (filters.transmission && v.transmission !== filters.transmission) return false;
      if (filters.condition && v.condition !== filters.condition) return false;
      if (filters.region && v.region !== filters.region) return false;
      if (filters.minPrice && v.price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && v.price > Number(filters.maxPrice)) return false;
      if (filters.minYear && v.year < Number(filters.minYear)) return false;
      if (filters.maxYear && v.year > Number(filters.maxYear)) return false;
      return true;
    });
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

  const activeCount = Object.entries(filters).filter(([, v]) => v !== "").length;

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
        <div className="space-y-2">
          {CONDITIONS.map((c) => (
            <label key={c.value} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <Checkbox
                checked={filters.condition === c.value}
                onCheckedChange={(checked) => set("condition", checked ? c.value : "")}
              />
              {c.label}
            </label>
          ))}
        </div>
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
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      {/* Desktop filters */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-xl border bg-card p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </h2>
          {FilterPanel}
        </div>
      </aside>

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span> vehicles found
          </p>
          <div className="flex items-center gap-2">
            {/* Mobile filter trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
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
                <div className="mt-6">{FilterPanel}</div>
              </SheetContent>
            </Sheet>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-[170px]">
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
          <div className={cn("mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3")}>
            {filtered.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
