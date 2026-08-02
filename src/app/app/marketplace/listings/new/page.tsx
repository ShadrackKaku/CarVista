import type { Metadata } from "next";
import { ListVehicleForm } from "@/components/vehicles/list-vehicle-form";

export const metadata: Metadata = { title: "List a vehicle" };

/**
 * Listing a car is authenticated work, so it lives inside the shell rather than
 * on the public site. `/vehicles/new` still resolves — it redirects here, which
 * routes a signed-out visitor through login and back to this page.
 *
 * The marketing headline the public page carried is gone: the shell's topbar
 * already names the page, and repeating it pushed the form below the fold.
 */
export default function NewListingPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <ListVehicleForm />
    </div>
  );
}
