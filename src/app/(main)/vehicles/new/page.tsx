import { redirect } from "next/navigation";

/**
 * Moved into the Marketplace module. Kept because the public footer, header and
 * home page all point here — a signed-out visitor lands on login and comes back
 * to the form, and a signed-in one goes straight to it inside the shell.
 */
export default function MovedPage() {
  redirect("/app/marketplace/listings/new");
}
