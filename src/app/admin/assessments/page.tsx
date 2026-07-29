import { Database, ExternalLink } from "lucide-react";
import { getAdminAssessments } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { AssessmentReview } from "@/components/admin/assessment-review";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "warning" | "success" | "destructive"> = {
  PENDING: "warning",
  VERIFIED: "success",
  REJECTED: "destructive",
};

const SOURCE_LABELS: Record<string, string> = {
  PLATFORM_DEAL: "CarVista deal",
  AGENT: "Clearing agent",
  COMMUNITY: "Community",
  ICUMS_LOOKUP: "ICUMS lookup",
};

export default async function AdminAssessmentsPage() {
  const rows = await getAdminAssessments();
  const pending = rows.filter((r) => r.status === "PENDING").length;
  const verified = rows.filter((r) => r.status === "VERIFIED").length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center gap-2">
        <Database className="h-6 w-6 text-brand-600" />
        <h1 className="font-display text-2xl font-bold">Duty assessments</h1>
      </div>
      <p className="mt-1 text-muted-foreground">
        Real ICUMS outcomes submitted by importers and agents — the training data for the
        landed-cost engine. {pending} pending · {verified} verified.
      </p>

      {rows.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
          <Database className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No submissions yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Share the /import/duty-check page to start collecting real duty bills.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {rows.map((a) => (
            <div key={a.id} className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{a.vehicle}</h2>
                    <Badge variant={STATUS_VARIANT[a.status] ?? "warning"}>{a.status}</Badge>
                    <Badge variant="outline">{SOURCE_LABELS[a.source] ?? a.source}</Badge>
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {a.chassisNumber} · submitted {formatDate(a.createdAt)}
                    {a.submittedBy ? ` by ${a.submittedBy}` : ""}
                  </p>
                </div>
                <AssessmentReview id={a.id} status={a.status} />
              </div>

              <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <Row label="Total tax" value={formatCurrency(a.totalTax)} strong />
                {a.hdv != null && <Row label="HDV" value={formatCurrency(a.hdv, "USD")} />}
                {a.cifNcy != null && <Row label="CIF (GHS)" value={formatCurrency(a.cifNcy)} />}
                {a.engineSizeCc != null && <Row label="Engine" value={`${a.engineSizeCc} cc`} />}
                {a.fuelType && <Row label="Fuel" value={a.fuelType} />}
                {a.hsCode && <Row label="HS code" value={a.hsCode} />}
                {a.exchangeRate != null && (
                  <Row label="FX (GHS/USD)" value={a.exchangeRate.toFixed(4)} />
                )}
                <Row label="Port" value={a.port} />
                {a.assessedAt && <Row label="Assessed" value={formatDate(a.assessedAt)} />}
              </dl>

              {a.notes && (
                <p className="mt-3 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
                  {a.notes}
                </p>
              )}

              {a.status === "REJECTED" && a.rejectionReason && (
                <p className="mt-3 text-sm text-destructive">Rejected: {a.rejectionReason}</p>
              )}

              {a.documentUrls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {a.documentUrls.map((url, i) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-accent"
                    >
                      <ExternalLink className="h-3 w-3" /> Bill photo {i + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-semibold" : undefined}>{value}</dd>
    </div>
  );
}
