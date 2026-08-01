import { MessageSquare } from "lucide-react";
import { getAllReviews } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { formatDate, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await getAllReviews();
  return (
    <div className="mx-auto max-w-5xl">
      {reviews.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border bg-card p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{r.author}</span>
                  <StarRating rating={r.rating} size={13} />
                  {r.verified && <Badge variant="success">Verified</Badge>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{formatDate(r.date)}</span>
                  <AdminActionButton
                    endpoint={`/api/admin/reviews/${r.id}`}
                    method="DELETE"
                    variant="destructive"
                    confirmMessage="Delete this review? This can't be undone."
                    successMessage="Review deleted"
                  >
                    Delete
                  </AdminActionButton>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{truncate(r.comment, 240)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
