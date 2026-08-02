import { redirect } from "next/navigation";

/** Paystack returns here; the receipt itself renders inside the shell. */
export default function MovedPage() {
  redirect("/app/marketplace/checkout/verify");
}
