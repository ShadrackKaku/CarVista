import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { getCurrentUser } from "@/lib/session";
import { getSavedVehicles } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const user = await getCurrentUser();
  const saved = user ? await getSavedVehicles(user.id) : [];

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-2xl font-bold">Saved Vehicles</h1>
      <p className="mt-1 text-muted-foreground">Vehicles you've saved for later.</p>
      {saved.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {saved.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          You haven't saved any vehicles yet. Browse the marketplace and tap the heart to save.
        </p>
      )}
    </div>
  );
}
