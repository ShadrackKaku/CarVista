import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";

export default function Loading() {
  return (
    <div className="container-page py-10">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="mb-6 flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32" />
        ))}
      </div>
      <CardGridSkeleton count={9} columns="sm:grid-cols-2 lg:grid-cols-3" />
    </div>
  );
}
