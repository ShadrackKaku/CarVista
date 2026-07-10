import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ListVehicleForm } from "@/components/vehicles/list-vehicle-form";

export const metadata: Metadata = {
  title: "Sell Your Car — List a Vehicle",
  description: "List your vehicle for sale on CarVista and reach thousands of buyers across Ghana.",
  alternates: { canonical: "/vehicles/new" },
};

export default function NewVehiclePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Sell your car"
        title="List a vehicle in minutes"
        description="Reach thousands of verified buyers across Ghana. Add photos, videos and details — it's free to list."
      />
      <div className="container-page py-10">
        <ListVehicleForm />
      </div>
    </div>
  );
}
