import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";

export default function Loading() {
  return (
    <div className="container-page py-10">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-9 w-60" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <CardGridSkeleton count={8} />
    </div>
  );
}
