import Link from "next/link";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { getAdminEscrowPlans } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusVariant: Record<string, "success" | "brand" | "secondary" | "destructive"> = {
  DRAFT: "secondary",
  ACTIVE: "brand",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

export default async function AdminEscrowPage() {
  const { plans, totals } = await getAdminEscrowPlans();

  return (
    <div className="mx-auto max-w-6xl">
      {/* Summary tiles */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Tile label="Collected" value={formatCurrency(totals.collected)} />
        <Tile label="Outstanding (active)" value={formatCurrency(totals.outstanding)} />
        <Tile label="Refunded" value={formatCurrency(totals.refunded)} />
        <Tile label="Active plans" value={String(totals.activePlans)} />
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
          <ShieldCheck className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No escrow plans yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create one from any import to start protected installments.
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Import</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Installments</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">Outstanding</th>
                  <th className="px-4 py-3 font-medium">Refunded</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {plans.map((p) => (
                  <tr key={p.importId} className="hover:bg-accent/40">
                    <td className="px-4 py-3 font-medium">{p.ref}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.customer}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[p.status] ?? "secondary"}>{p.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.milestonesPaid}/{p.milestonesTotal}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(p.total)}</td>
                    <td className="px-4 py-3 text-success">{formatCurrency(p.paid)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatCurrency(p.outstanding)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.refunded > 0 ? formatCurrency(p.refunded) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/imports/${p.importId}`}
                        className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                      >
                        Manage <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
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

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-soft">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
    </div>
  );
}
