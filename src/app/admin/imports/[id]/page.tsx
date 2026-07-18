import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getImportRequestDetail } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { AdvanceImportForm } from "@/components/admin/advance-import-form";
import { ImportQuoteForm } from "@/components/admin/import-quote-form";
import { EscrowPlanManager } from "@/components/admin/escrow-plan-manager";
import { IMPORT_STAGES } from "@/lib/constants";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function stageLabel(stage: string) {
  return IMPORT_STAGES.find((s) => s.value === stage)?.label ?? stage;
}

export default async function AdminImportDetailPage({ params }: { params: { id: string } }) {
  const req = await getImportRequestDetail(params.id);
  if (!req) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/imports"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All imports
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{req.ref}</h1>
          <p className="mt-1 text-muted-foreground">
            {req.vehicle} · {req.origin}
          </p>
        </div>
        <Badge variant="brand">{stageLabel(req.stage)}</Badge>
      </div>

      {/* Details */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Request</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Customer" value={req.customer} />
            <Row label="Email" value={req.customerEmail ?? "—"} />
            <Row label="Auction source" value={req.auctionSource ?? "—"} />
            <Row label="Budget" value={req.budget ? formatCurrency(req.budget) : "—"} />
            <Row label="Tracking no." value={req.trackingNumber ?? "—"} />
            <Row
              label="Est. arrival"
              value={req.estimatedArrival ? formatDate(req.estimatedArrival) : "—"}
            />
            {req.vehicleSlug && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Listing</dt>
                <dd>
                  <Link
                    href={`/vehicles/${req.vehicleSlug}`}
                    className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline"
                  >
                    View <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </dd>
              </div>
            )}
          </dl>
          {req.notes && (
            <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">{req.notes}</p>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Landed-cost quote</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            The figure you stand behind — the customer's guaranteed total.
          </p>
          <div className="mt-3">
            <ImportQuoteForm id={req.id} quote={req.quote} />
          </div>
        </div>
      </div>

      {/* Escrow payment plan */}
      <div className="mt-6 rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Milestone payment plan</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Protected installments the buyer pays as each import stage is verified. Non-custodial —
          funds settle straight to the merchant account via Paystack.
        </p>
        <div className="mt-4">
          <EscrowPlanManager
            importId={req.id}
            escrow={req.escrow}
            quoteTotal={req.quote.total}
          />
        </div>
      </div>

      {/* Advance */}
      <div className="mt-6 rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Post an update</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Moves the stage, notifies the customer's tracking view, and (for a linked listing) records
          the milestone on the vehicle's Passport.
        </p>
        <div className="mt-4">
          <AdvanceImportForm id={req.id} currentStage={req.stage} />
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-6 rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Timeline</h2>
        {req.events.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No updates posted yet.</p>
        ) : (
          <ol className="mt-4">
            {req.events.map((e, i) => (
              <li key={e.id} className="relative flex gap-4 pb-5 last:pb-0">
                {i < req.events.length - 1 && (
                  <span className="absolute bottom-0 left-[5px] top-4 w-px bg-border" aria-hidden />
                )}
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{e.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(e.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stageLabel(e.stage)}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                  {e.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
