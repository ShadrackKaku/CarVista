import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SAMPLE_VEHICLES } from "@/lib/sample-data";
import { formatCurrency } from "@/lib/utils";

export default function AdminVehiclesPage() {
  const vehicles = SAMPLE_VEHICLES;
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Vehicle Listings</h1>
          <p className="mt-1 text-muted-foreground">Review, approve and manage all vehicle listings.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">All</Button>
          <Button variant="outline" size="sm">Pending</Button>
          <Button variant="outline" size="sm">Active</Button>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-soft">
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
                        <Image src={v.images[0]} alt={v.title} fill sizes="64px" className="object-cover" />
                      </div>
                      <div>
                        <p className="font-medium">{v.title}</p>
                        <p className="text-xs text-muted-foreground">{v.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{v.dealer.name}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(v.price)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={v.verified ? "success" : "warning"}>
                      {v.verified ? "Verified" : "Pending"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm">View</Button>
                      {!v.verified && (
                        <Button variant="success" size="sm">Approve</Button>
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
