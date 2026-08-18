import { Skeleton } from "@/components/ui/skeleton";
import { ListingGrid } from "@/components/ui/listing-card";

/**
 * The placeholder a browse page shows while its cards are still coming.
 *
 * It lays out through `ListingGrid` rather than describing its own columns,
 * because a skeleton that disagrees with the grid it stands in for is worse than
 * no skeleton: the page settles into one shape and then jumps to another. Every
 * caller here used to pass its own column string, and three of the four had
 * drifted from what their page actually rendered — the vehicles placeholder
 * promised three across, the parts one five.
 *
 * The block is shaped like the real card too — same radius, same flush
 * photograph, same padding — so what arrives is the thing that was standing
 * there.
 */
export function CardGridSkeleton({
  count = 8,
  aspect = "aspect-[16/11]",
  className,
}: {
  count?: number;
  /** Matches whatever `ListingCardMedia` this page's card asks for. */
  aspect?: string;
  className?: string;
}) {
  return (
    <ListingGrid className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border bg-card shadow-soft">
          <Skeleton className={`w-full rounded-none ${aspect}`} />
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3.5 w-1/2" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      ))}
    </ListingGrid>
  );
}
