import { ClipboardCheck } from "lucide-react";
import { getAdminInspections } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { InspectionReportDialog } from "@/components/admin/inspection-report-dialog";
import { formatDate } from "@/lib/utils";
import { guardPage } from "@/lib/page-guard";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "success" | "brand" | "warning" | "destructive" | "muted"> = {
  COMPLETED: "success",
  CONFIRMED: "brand",
  PENDING: "warning",
  CANCELLED: "destructive",
};

export default async function AdminInspectionsPage() {
  await guardPage("inspections:manage");
  const rows = await getAdminInspections();

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-muted-foreground">Manage inspection bookings and file reports.</p>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
          <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No inspection bookings yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Ref</th>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Scheduled</th>
                  <th className="px-4 py-3 font-medium">Grade</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((b) => (
                  <tr key={b.id} className="hover:bg-accent/40">
                    <td className="px-4 py-3 font-medium">{b.ref}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.vehicleInfo}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.customer ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(b.scheduledAt)}</td>
                    <td className="px-4 py-3 font-medium">{b.overallGrade ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[b.status] ?? "muted"}>{b.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <InspectionReportDialog
                        id={b.id}
                        ref={b.ref}
                        initial={{
                          overallGrade: b.overallGrade,
                          reportSummary: b.reportSummary,
                          reportUrl: b.reportUrl,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
