import Link from "next/link";
import { getDealers } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { AdminActionButton } from "@/components/admin/admin-action-button";

export const dynamic = "force-dynamic";

export default async function AdminDealersPage() {
  const dealers = await getDealers();
  return (
    <div className="mx-auto max-w-6xl">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Dealer</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Vehicles</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {dealers.map((d) => (
                <tr key={d.id} className="hover:bg-accent/40">
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {d.city}, {d.region}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{d.vehicleCount}</td>
                  <td className="px-4 py-3">
                    <StarRating rating={d.rating} size={13} showValue />
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={d.verified ? "success" : "warning"}>
                      {d.verified ? "Verified" : "Pending"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/app/marketplace/dealers/${d.slug}`}>View</Link>
                      </Button>
                      {d.verified ? (
                        <AdminActionButton
                          endpoint={`/api/admin/dealers/${d.id}`}
                          body={{ verified: false }}
                          variant="outline"
                          successMessage="Dealer un-verified"
                        >
                          Un-verify
                        </AdminActionButton>
                      ) : (
                        <AdminActionButton
                          endpoint={`/api/admin/dealers/${d.id}`}
                          body={{ verified: true }}
                          variant="success"
                          successMessage="Dealer verified"
                        >
                          Verify
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
