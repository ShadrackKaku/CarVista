import { redirect } from "next/navigation";

/** Editing a listing moved inside the shell; old links still land on the form. */
export default function MovedPage({ params }: { params: { slug: string } }) {
  redirect(`/app/marketplace/listings/${params.slug}/edit`);
}
