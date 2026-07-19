import { ShieldCheck, ExternalLink } from "lucide-react";
import { getAdminVerifications } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { VerificationReview } from "@/components/admin/verification-review";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "warning" | "success" | "destructive"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

export default async function AdminVerificationsPage() {
  const rows = await getAdminVerifications();
  const pending = rows.filter((r) => r.status === "PENDING").length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-brand-600" />
        <h1 className="font-display text-2xl font-bold">Dealer verifications</h1>
      </div>
      <p className="mt-1 text-muted-foreground">
        {pending} pending review{pending === 1 ? "" : "s"}. Approving turns on the dealer&apos;s trust
        badge.
      </p>

      {rows.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
          <ShieldCheck className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No submissions yet</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {rows.map((v) => (
            <div key={v.id} className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{v.dealerName}</h2>
                    <Badge variant={STATUS_VARIANT[v.status] ?? "warning"}>{v.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Submitted {formatDate(v.submittedAt)}</p>
                </div>
                <VerificationReview id={v.id} status={v.status} />
              </div>

              <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <Row label="Business reg." value={v.businessRegNumber} />
                <Row label="Contact" value={`${v.contactName} · ${v.contactPhone}`} />
                <Row label="ID" value={`${v.idType} · ${v.idNumber}`} />
                {v.documentUrl && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Document</dt>
                    <dd>
                      <a
                        href={v.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline"
                      >
                        View <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
              {v.notes && (
                <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">{v.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
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
