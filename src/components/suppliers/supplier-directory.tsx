"use client";

import { useMemo, useState } from "react";
import { Building2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SupplierCard } from "@/components/suppliers/supplier-card";
import { SUPPLIER_CATEGORIES, SUPPLIER_CATEGORY_LABELS } from "@/lib/suppliers";
import { cn } from "@/lib/utils";
import type { SupplierRow } from "@/lib/queries";

/**
 * The wholesale directory.
 *
 * Filtering happens in the browser because the list is capped at sixty — a
 * round trip per keystroke would be slower and no more correct at that size.
 */
export function SupplierDirectory({
  suppliers,
  basePath = "/suppliers",
}: {
  suppliers: SupplierRow[];
  basePath?: string;
}) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return suppliers.filter((s) => {
      if (category && !s.categories.includes(category as never)) return false;
      if (!term) return true;
      return (
        s.name.toLowerCase().includes(term) ||
        s.city.toLowerCase().includes(term) ||
        s.description.toLowerCase().includes(term)
      );
    });
  }, [suppliers, q, category]);

  if (suppliers.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
        <Building2 className="h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">No suppliers listed yet</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Wholesalers appear here once their application is approved. We don&apos;t list
          placeholder businesses — an empty directory is better than an enquiry that goes nowhere.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, city or what they stock"
            className="pl-9"
            aria-label="Search suppliers"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <CategoryChip active={category === null} onClick={() => setCategory(null)}>
          All
        </CategoryChip>
        {SUPPLIER_CATEGORIES.map((c) => (
          <CategoryChip
            key={c}
            active={category === c}
            onClick={() => setCategory(category === c ? null : c)}
          >
            {SUPPLIER_CATEGORY_LABELS[c]}
          </CategoryChip>
        ))}
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
        {filtered.length === 1 ? "supplier" : "suppliers"}
      </p>

      {filtered.length > 0 ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((s) => (
            <SupplierCard key={s.id} supplier={s} basePath={basePath} />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          Nothing matches that. Try a broader search or clear the category filter.
        </p>
      )}
    </div>
  );
}

function CategoryChip({
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
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
