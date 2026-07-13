import { MessageSquare } from "lucide-react";
import { getReviews } from "@/lib/queries";
import { StarRating } from "@/components/star-rating";
import { ReviewForm } from "@/components/reviews/review-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatDate } from "@/lib/utils";

export async function ReviewsSection({
  targetType,
  targetId,
}: {
  targetType: "vehicle" | "part" | "dealer" | "service";
  targetId: string;
}) {
  const reviews = await getReviews(targetType, targetId);
  const avg =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <section className="mt-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold">
          Reviews {reviews.length > 0 && <span className="text-muted-foreground">({reviews.length})</span>}
        </h2>
        {reviews.length > 0 && <StarRating rating={avg} showValue size={16} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed p-10 text-center">
              <MessageSquare className="h-7 w-7 text-muted-foreground" />
              <p className="mt-3 font-medium">No reviews yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Be the first to leave a review.</p>
            </div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="rounded-xl border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{getInitials(r.author)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{r.author}</p>
                      <StarRating rating={r.rating} size={12} />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(r.date)}</span>
                </div>
                {r.title && <p className="mt-3 font-medium">{r.title}</p>}
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.comment}</p>
              </div>
            ))
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <ReviewForm targetType={targetType} targetId={targetId} />
        </div>
      </div>
    </section>
  );
}
