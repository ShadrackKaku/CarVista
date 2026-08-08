"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ServiceCard } from "@/components/services/service-card";
import { FilterLayout } from "@/components/shell/filter-dock";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { SERVICE_TYPES } from "@/lib/constants";
import { usePagedList } from "@/lib/use-paged-list";
import { cn } from "@/lib/utils";
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

  const FilterPanel = (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Service type</Label>
        {/* A column rather than the horizontal chip strip this used to be: in a
            fixed-width panel the list reads top to bottom without scrolling
            sideways past the options you cannot see. */}
        <div className="flex flex-col gap-1">
          <TypeOption active={type === ""} onClick={() => setType("")}>
            All services
          </TypeOption>
          {SERVICE_TYPES.map((t) => (
            <TypeOption key={t.value} active={type === t.value} onClick={() => setType(t.value)}>
              {t.label}
            </TypeOption>
          ))}
        </div>
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
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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

function TypeOption({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
        active
          ? "bg-brand-600/10 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
