import { Skeleton } from "@/components/ui/skeleton";

/** A responsive grid of placeholder cards used by list-page loading states. */
export function CardGridSkeleton({
  count = 8,
  aspect = "aspect-[4/3]",
  columns = "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
}: {
  count?: number;
  aspect?: string;
  columns?: string;
}) {
  return (
    <div className={`grid grid-cols-1 gap-5 ${columns}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border bg-card shadow-soft">
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
    </div>
  );
}
