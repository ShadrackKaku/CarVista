import Link from "next/link";
import { Car, Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDealerInventory } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { DealerListingsTable } from "@/components/dealer/dealer-listings-table";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DealerListingsPage() {
  const user = await getCurrentUser();
  const listings = user ? await getDealerInventory(user.id) : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="gradient">
          <Link href="/app/marketplace/listings/new">
            <Plus className="h-4 w-4" /> Add vehicle
          </Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
          <Car className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No listings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your first vehicle to start selling.</p>
          <Button asChild variant="gradient" className="mt-5">
            <Link href="/app/marketplace/listings/new">
              <Plus className="h-4 w-4" /> Add vehicle
            </Link>
          </Button>
        </div>
      ) : (
        <DealerListingsTable listings={listings} />
      )}
    </div>
  );
}
