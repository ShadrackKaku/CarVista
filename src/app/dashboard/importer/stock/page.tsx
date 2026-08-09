import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getImporterForUser, getImporterStock } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSourceAmount } from "@/lib/import-stock";
import { ListingStatusAction } from "@/components/import-stock/listing-status-action";

export const dynamic = "force-dynamic";

const STATUS_VARIANT = {
  ACTIVE: "success",
  FULLY_RESERVED: "brand",
  DRAFT: "secondary",
  SOLD_OUT: "outline",
  ARCHIVED: "outline",
} as const;

export default async function ImporterStockPage() {
  const user = await getCurrentUser();
  const importer = user ? await getImporterForUser(user.id) : null;
  const listings = importer ? await getImporterStock(importer.id) : [];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button asChild variant="gradient" size="sm">
          <Link href="/dashboard/importer/stock/new">
            <Plus className="h-4 w-4" /> List a car
          </Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No stock yet. Publish a car and buyers can reserve a unit of it.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Car</th>
                <th className="p-3 font-medium">FOB</th>
                <th className="p-3 font-medium">Units</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="p-3">
                    <Link
                      href={`/app/imports/stock/${l.slug}`}
                      className="font-medium hover:text-brand-600"
                    >
                      {l.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {l.countryOfOrigin}
                      {l.auctionGrade ? ` · Grade ${l.auctionGrade}` : ""}
                    </p>
                  </td>
                  <td className="p-3 tabular-nums">
                    {formatSourceAmount(l.fobAmount, l.fobCurrency)}
                    {l.fxRateToGhs == null && (
                      <p className="text-xs text-warning">No exchange rate set</p>
                    )}
                  </td>
                  <td className="p-3 tabular-nums">
                    {Math.max(0, l.quantity - l.held)} free of {l.quantity}
                    {l.held > 0 && (
                      <p className="text-xs text-muted-foreground">{l.held} on hold</p>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge variant={STATUS_VARIANT[l.status as keyof typeof STATUS_VARIANT]}>
                      {l.status.replace("_", " ").toLowerCase()}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/importer/stock/${l.id}/edit`}>Edit</Link>
                      </Button>
                      <ListingStatusAction listingId={l.id} status={l.status} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
