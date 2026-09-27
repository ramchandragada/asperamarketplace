import { PageShell } from "@/components/ui/page-shell";
import { ProductCardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function BrowseLoading() {
  return (
    <PageShell>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Skeleton className="hidden h-[28rem] lg:block" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </PageShell>
  );
}
