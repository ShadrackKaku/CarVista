import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { getAdminVehicles } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusVariant: Record<string, "success" | "warning" | "destructive" | "muted"> = {
  ACTIVE: "success",
  PENDING: "warning",
  DRAFT: "muted",
  SOLD: "muted",
  ARCHIVED: "muted",
  REJECTED: "destructive",
};

export default async function AdminVehiclesPage() {
  const vehicles = await getAdminVehicles();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Dealer</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-accent/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-16 overflow-hidden rounded-lg bg-muted">
                        <Image src={v.image} alt={v.title} fill sizes="64px" className="object-cover" />
                      </div>
                      <div>
                        <p className="font-medium">{v.title}</p>
                        <p className="text-xs text-muted-foreground">{v.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{v.dealer}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(v.price)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[v.status] ?? "muted"}>
                      {v.status[0] + v.status.slice(1).toLowerCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/app/marketplace/vehicles/${v.slug}`}>View</Link>
                      </Button>
                      {v.status !== "ACTIVE" && (
                        <AdminActionButton
                          endpoint={`/api/admin/vehicles/${v.id}`}
                          body={{ action: "approve" }}
                          variant="success"
                          successMessage="Listing approved"
                        >
                          Approve
                        </AdminActionButton>
                      )}
                      {v.status !== "REJECTED" && (
                        <AdminActionButton
                          endpoint={`/api/admin/vehicles/${v.id}`}
                          body={{ action: "reject" }}
                          variant="destructive"
                          confirmMessage="Reject this listing? It will be hidden from the marketplace."
                          successMessage="Listing rejected"
                        >
                          Reject
                        </AdminActionButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
