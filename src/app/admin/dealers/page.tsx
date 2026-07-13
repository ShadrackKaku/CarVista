import Link from "next/link";
import { getDealers } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";

export const dynamic = "force-dynamic";

export default async function AdminDealersPage() {
  const dealers = await getDealers();
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-2xl font-bold">Dealers</h1>
      <p className="mt-1 text-muted-foreground">Manage and verify dealer accounts.</p>

      <div className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-soft">
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
                        <Link href={`/dealers/${d.slug}`}>View</Link>
                      </Button>
                      {!d.verified && <Button variant="success" size="sm">Verify</Button>}
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
