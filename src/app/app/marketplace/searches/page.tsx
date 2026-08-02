import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, Search } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getUserSavedSearches } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { SavedSearchRow } from "@/components/search/saved-search-row";

export const dynamic = "force-dynamic";

export default async function SavedSearchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/app/marketplace/searches");

  const searches = await getUserSavedSearches(user.id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline">
          <Link href="/app/marketplace/vehicles">
            <Search className="h-4 w-4" /> Browse vehicles
          </Link>
        </Button>
      </div>

      {searches.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
          <Bookmark className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No saved searches yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Set your filters on the marketplace, then tap “Save search” to keep them here.
          </p>
          <Button asChild className="mt-4" variant="gradient">
            <Link href="/app/marketplace/vehicles">Start searching</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {searches.map((s) => (
            <SavedSearchRow key={s.id} id={s.id} name={s.name} query={s.query} createdAt={s.createdAt} />
          ))}
        </div>
      )}
    </div>
  );
}
