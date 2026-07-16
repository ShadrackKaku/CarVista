import Link from "next/link";
import { Ship } from "lucide-react";
import { getAllImportRequests } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { IMPORT_STAGES } from "@/lib/constants";

export const dynamic = "force-dynamic";

function stageLabel(stage: string) {
  return IMPORT_STAGES.find((s) => s.value === stage)?.label ?? stage;
}

export default async function AdminImportsPage() {
  const imports = await getAllImportRequests();
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-2xl font-bold">Import Requests</h1>
      <p className="mt-1 text-muted-foreground">Vehicle import & sourcing requests from customers.</p>

      {imports.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
          <Ship className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No import requests yet</p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Origin</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {imports.map((r) => (
                  <tr key={r.id} className="hover:bg-accent/40">
                    <td className="px-4 py-3 font-medium">{r.ref}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.customer}</td>
                    <td className="px-4 py-3">{r.vehicle}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.origin}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(r.date)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="brand">{stageLabel(r.stage)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/imports/${r.id}`}>Manage</Link>
                      </Button>
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
