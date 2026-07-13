"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, PackageSearch, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ImportTimeline } from "@/components/import/import-timeline";
import { IMPORT_STAGES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface TrackResult {
  found: boolean;
  ref?: string;
  vehicle?: string;
  origin?: string;
  stage?: string;
  estimatedArrival?: string | null;
}

function stageLabel(stage: string) {
  return IMPORT_STAGES.find((s) => s.value === stage)?.label ?? stage;
}

export default function TrackImportPage() {
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);

  async function onTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!ref.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/import-requests/track?ref=${encodeURIComponent(ref.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Lookup failed");
        return;
      }
      setResult(data);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Vehicle Import"
        title="Track your import"
        description="Enter your import reference number to see the latest status of your vehicle."
      />
      <div className="container-page py-10">
        <form onSubmit={onTrack} className="mx-auto flex max-w-xl gap-2">
          <Input
            placeholder="e.g. IMP-8K2L-A9F3"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="h-12"
          />
          <Button type="submit" variant="gradient" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Track
          </Button>
        </form>

        <div className="mx-auto mt-8 max-w-xl">
          {result && result.found && (
            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{result.vehicle}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ref {result.ref} · From {result.origin}
                    {result.estimatedArrival ? ` · ETA ${formatDate(result.estimatedArrival)}` : ""}
                  </p>
                </div>
                <Badge variant="brand">{stageLabel(result.stage ?? "")}</Badge>
              </div>
              <div className="mt-6">
                <ImportTimeline currentStage={result.stage ?? "REQUESTED"} />
              </div>
            </div>
          )}

          {result && !result.found && (
            <div className="flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
              <PackageSearch className="h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">No import found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We couldn't find an import with that reference. Double-check the number, or{" "}
                <Link href="/contact" className="font-medium text-brand-600 hover:underline">
                  contact support
                </Link>
                .
              </p>
            </div>
          )}

          {!result && (
            <div className="rounded-2xl border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Your reference number was sent to you when your import request was confirmed. Logged
              in?{" "}
              <Link href="/dashboard/imports" className="font-medium text-brand-600 hover:underline">
                View all your imports
              </Link>
              .
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
