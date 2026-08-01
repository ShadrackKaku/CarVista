import type { Metadata } from "next";
import { VehicleBrowser } from "@/components/vehicles/vehicle-browser";
import { getVehicles } from "@/lib/queries";
import { queryToFilters } from "@/lib/vehicle-search";

export const metadata: Metadata = { title: "Vehicles" };
export const dynamic = "force-dynamic";

/**
 * The same browser the public listing page renders — one component, two
 * entry points. Inside the shell it drops the marketing chrome and gains the
 * module navigation instead.
 */
export default async function AppVehiclesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const vehicles = await getVehicles();
  const { filters, sort } = queryToFilters(searchParams);
  return (
    <VehicleBrowser
      vehicles={vehicles}
      initialFilters={filters}
      initialSort={sort}
      basePath="/app/marketplace/vehicles"
    />
  );
}
