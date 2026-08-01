import { redirect } from "next/navigation";

/** Moved into the Marketplace module. Kept so existing links still land. */
export default function MovedPage() {
  redirect("/app/marketplace/saved");
}
