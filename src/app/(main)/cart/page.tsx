import { redirect } from "next/navigation";

/** Buying is authenticated work; the cart lives in the shell. */
export default function MovedPage() {
  redirect("/app/marketplace/cart");
}
