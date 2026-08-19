"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ServiceCard } from "@/components/services/service-card";
import { ListingGrid } from "@/components/ui/listing-card";
import { Facet, FilterLayout, MultiFacet } from "@/components/shell/filter-dock";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { SERVICE_TYPES } from "@/lib/constants";
import { usePagedList } from "@/lib/use-paged-list";
import { matchesAny, selectedValues } from "@/lib/multi-select";
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

  const filtered = services.filter((s) => matchesAny(type, s.type));
  const paged = usePagedList(filtered, type);

  // Counts come off the unfiltered list because type is the only facet here —
  // there is no other filter for them to have to respect.
  const counts = services.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] ?? 0) + 1;
    return acc;
  }, {});

  const FilterPanel = (
    <div className="space-y-5">
      <Facet label="Service type">
        <MultiFacet
          name="serviceType"
          anyLabel="All services"
          options={SERVICE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          value={type}
          onChange={setType}
          counts={{ any: services.length, ...counts }}
          maxRows={8}
        />
      </Facet>

      {type && (
        <Button variant="outline" className="w-full" onClick={() => setType("")}>
          <X className="h-4 w-4" /> Clear filter
        </Button>
      )}
    </div>
  );

  return (
    <FilterLayout filters={FilterPanel} activeCount={selectedValues(type).length}>
      <div ref={paged.anchorRef}>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "provider" : "providers"}
        </p>
      </div>

      {filtered.length > 0 ? (
        <>
          <ListingGrid className="mt-5">
            {paged.items.map((s) => (
              <ServiceCard key={s.id} service={s} basePath={basePath} />
            ))}
          </ListingGrid>
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
