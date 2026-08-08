"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ServiceCard } from "@/components/services/service-card";
import { FilterLayout, FilterOption, FilterOptionList } from "@/components/shell/filter-dock";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { SERVICE_TYPES } from "@/lib/constants";
import { usePagedList } from "@/lib/use-paged-list";
import type { SampleService } from "@/lib/sample-data";

export function ServicesBrowser({
  services,
  basePath = "/services",
}: {
  services: SampleService[];
  /** Where result cards link. The Marketplace module keeps them in the shell. */
  basePath?: string;
}) {
  const [type, setType] = useState("");

  const filtered = type ? services.filter((s) => s.type === type) : services;
  const paged = usePagedList(filtered, type);

  // Counts come off the unfiltered list because type is the only facet here —
  // there is no other filter for them to have to respect.
  const counts = services.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] ?? 0) + 1;
    return acc;
  }, {});

  const FilterPanel = (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Service type</Label>
        {/* A column rather than the horizontal chip strip this used to be: in a
            fixed-width panel the list reads top to bottom without scrolling
            sideways past the options you cannot see. */}
        <FilterOptionList>
          <FilterOption
            name="serviceType"
            label="All services"
            checked={type === ""}
            onSelect={() => setType("")}
            count={services.length}
          />
          {SERVICE_TYPES.map((t) => (
            <FilterOption
              key={t.value}
              name="serviceType"
              label={t.label}
              checked={type === t.value}
              onSelect={() => setType(t.value)}
              count={counts[t.value] ?? 0}
            />
          ))}
        </FilterOptionList>
      </div>

      {type && (
        <Button variant="outline" className="w-full" onClick={() => setType("")}>
          <X className="h-4 w-4" /> Clear filter
        </Button>
      )}
    </div>
  );

  return (
    <FilterLayout filters={FilterPanel} activeCount={type ? 1 : 0}>
      <div ref={paged.anchorRef}>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "provider" : "providers"}
        </p>
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paged.items.map((s) => (
              <ServiceCard key={s.id} service={s} basePath={basePath} />
            ))}
          </div>
          <Pagination
            page={paged.page}
            pageCount={paged.pageCount}
            onPageChange={paged.goToPage}
            itemNoun="provider"
            from={paged.from}
            to={paged.to}
            total={paged.total}
          />
        </>
      ) : (
        <p className="mt-16 rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          No providers in this category yet. Check back soon.
        </p>
      )}
    </FilterLayout>
  );
}
