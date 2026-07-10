import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  size = 14,
  className,
  showValue = false,
  reviewCount,
}: {
  rating: number;
  size?: number;
  className?: string;
  showValue?: boolean;
  reviewCount?: number;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < Math.floor(rating);
          const half = !filled && i < Math.round(rating);
          return (
            <Star
              key={i}
              width={size}
              height={size}
              className={cn(
                filled || half ? "fill-warning text-warning" : "fill-muted text-muted",
              )}
            />
          );
        })}
      </div>
      {showValue && <span className="text-sm font-semibold">{rating.toFixed(1)}</span>}
      {reviewCount !== undefined && (
        <span className="text-xs text-muted-foreground">({reviewCount})</span>
      )}
    </div>
  );
}
