import { redirect } from "next/navigation";

/** Buying is authenticated work; checkout lives in the shell. */
export default function MovedPage() {
  redirect("/app/marketplace/checkout");
}
