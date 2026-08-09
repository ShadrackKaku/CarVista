import { getCurrentUser } from "@/lib/session";
import { getMyReservations } from "@/lib/queries";
import { MyReservations } from "@/components/import-stock/my-reservations";

export const dynamic = "force-dynamic";

export default async function MyReservationsPage() {
  const user = await getCurrentUser();
  const reservations = user ? await getMyReservations(user.id) : [];

  return <MyReservations reservations={reservations} />;
}
