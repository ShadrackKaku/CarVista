import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ListVehicleForm } from "@/components/vehicles/list-vehicle-form";
import { getCurrentUser } from "@/lib/session";
import { getVehicleBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditVehiclePage({ params }: { params: { slug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=/vehicles/${params.slug}/edit`);

  const vehicle = await getVehicleBySlug(params.slug);
  // Only the seller or an admin may edit (and sample-catalogue rows aren't
  // editable — they have no owner).
  if (!vehicle || (!vehicle.sellerId && user.role !== "ADMIN")) notFound();
  if (vehicle.sellerId && vehicle.sellerId !== user.id && user.role !== "ADMIN") notFound();

  return (
    <div>
      <PageHeader
        eyebrow="Edit listing"
        title={`Edit: ${vehicle.title}`}
        description="Update your listing details, photos and price. Changes go live immediately."
      />
      <div className="container-page py-10">
        <ListVehicleForm
          vehicleId={vehicle.id}
          initial={{
            title: vehicle.title,
            brandId: vehicle.brand,
            year: vehicle.year,
            price: String(vehicle.price),
            mileage: String(vehicle.mileage),
            fuelType: vehicle.fuelType,
            transmission: vehicle.transmission,
            engineSize: vehicle.engineSize ? String(vehicle.engineSize) : "",
            bodyType: vehicle.bodyType,
            condition: vehicle.condition,
            color: vehicle.color,
            city: vehicle.city,
            region: vehicle.region ?? "Greater Accra",
            description: vehicle.description,
            images: vehicle.images,
          }}
        />
      </div>
    </div>
  );
}
