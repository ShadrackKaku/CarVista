import type { Metadata } from "next";
import { VehicleBrowser } from "@/components/vehicles/vehicle-browser";
import { getVehicles } from "@/lib/queries";
import { queryToFilters } from "@/lib/vehicle-search";

export const metadata: Metadata = {
  title: "Vehicle Marketplace — Buy Cars in Ghana",
  description:
    "Browse thousands of new, foreign-used and Ghana-used cars for sale in Ghana. Filter by brand, price, year, body type and more.",
  alternates: { canonical: "/vehicles" },
};

export const dynamic = "force-dynamic";

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const vehicles = await getVehicles();
  const { filters, sort } = queryToFilters(searchParams);

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Vehicle Marketplace</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Explore verified new, foreign-used and Ghana-used vehicles from trusted dealers and
          private sellers across Ghana.
        </p>
      </div>
      <VehicleBrowser vehicles={vehicles} initialFilters={filters} initialSort={sort} />
    </div>
  );
}
