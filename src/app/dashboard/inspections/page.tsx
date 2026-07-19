import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardCheck, ExternalLink, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getUserInspections } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "success" | "brand" | "warning" | "destructive" | "muted"> = {
  COMPLETED: "success",
  CONFIRMED: "brand",
  PENDING: "warning",
  CANCELLED: "destructive",
};

export default async function InspectionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/inspections");

  const inspections = await getUserInspections(user.id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Inspections</h1>
          <p className="mt-1 text-muted-foreground">Your booked inspections and their reports.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/services">Book an inspection</Link>
        </Button>
      </div>

      {inspections.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
          <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No inspections yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Book an independent inspection before you buy — we&apos;ll post the full report here.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {inspections.map((b) => (
            <div key={b.id} className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{b.vehicleInfo}</h2>
                  <p className="text-xs text-muted-foreground">
                    {b.ref} · {b.location} · {formatDate(b.scheduledAt)}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[b.status] ?? "muted"}>{b.status}</Badge>
              </div>

              {b.reportSummary ? (
                <div className="mt-4 rounded-xl border bg-background/60 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-brand-600" />
                    <span className="text-sm font-semibold">Inspection report</span>
                    {b.overallGrade && (
                      <Badge variant="brand" className="ml-auto">
                        Grade {b.overallGrade}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                    {b.reportSummary}
                  </p>
                  {b.reportUrl && (
                    <a
                      href={b.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
                    >
                      Full report <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Report will appear here once the inspection is complete.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
