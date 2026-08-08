"use client";

import { useMemo, useState } from "react";
import { Search, ShieldCheck, X } from "lucide-react";
import { DealerCard } from "@/components/dealers/dealer-card";
import { FilterLayout } from "@/components/shell/filter-dock";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { GHANA_REGIONS } from "@/lib/constants";
import { usePagedList } from "@/lib/use-paged-list";
import type { SampleDealer } from "@/lib/sample-data";

/**
 * The dealer directory.
 *
 * This was a bare grid of every dealer, which was fine while the list fit on a
 * screen. Now that it pages, the page you want may not be the page you land on,
 * so it needs a way to ask for a dealer rather than only to scroll for one.
 */
export function DealerDirectory({
  dealers,
  basePath = "/dealers",
}: {
  dealers: SampleDealer[];
  basePath?: string;
}) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return dealers.filter((d) => {
      if (verifiedOnly && !d.verified) return false;
      if (region && d.region !== region) return false;
      if (!term) return true;
      return (
        d.name.toLowerCase().includes(term) ||
        d.city.toLowerCase().includes(term) ||
        d.description.toLowerCase().includes(term)
      );
    });
  }, [dealers, q, region, verifiedOnly]);

  const activeCount = (q ? 1 : 0) + (region ? 1 : 0) + (verifiedOnly ? 1 : 0);
  const paged = usePagedList(filtered, `${q}|${region}|${verifiedOnly}`);

  function reset() {
    setQ("");
    setRegion("");
    setVerifiedOnly(false);
  }

  const FilterPanel = (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name or city"
            className="pl-9"
            aria-label="Search dealers"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Region</Label>
        <Select value={region || "any"} onValueChange={(v) => setRegion(v === "any" ? "" : v)}>
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

      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <Checkbox
          checked={verifiedOnly}
          onCheckedChange={(checked) => setVerifiedOnly(checked === true)}
        />
        Verified dealers only
      </label>

      {activeCount > 0 && (
        <Button variant="outline" className="w-full" onClick={reset}>
          <X className="h-4 w-4" /> Clear filters
        </Button>
      )}
    </div>
  );

  return (
    <FilterLayout filters={FilterPanel} activeCount={activeCount}>
      <div ref={paged.anchorRef}>
        <div className="mb-6 flex items-center gap-2 rounded-xl border bg-brand-50/50 p-4 text-sm dark:bg-brand-900/10">
          <ShieldCheck className="h-5 w-5 shrink-0 text-brand-600" />
          <span className="text-muted-foreground">
            Look for the <span className="font-semibold text-foreground">Verified</span> badge — it
            means the dealer&apos;s business documents and location have been confirmed by CarVista.
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "dealer" : "dealers"}
        </p>
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {paged.items.map((dealer) => (
              <DealerCard key={dealer.id} dealer={dealer} basePath={basePath} />
            ))}
          </div>
          <Pagination
            page={paged.page}
            pageCount={paged.pageCount}
            onPageChange={paged.goToPage}
            itemNoun="dealer"
            from={paged.from}
            to={paged.to}
            total={paged.total}
          />
        </>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No dealers match that. Try a broader search or clear the filters.
        </p>
      )}
    </FilterLayout>
  );
}
