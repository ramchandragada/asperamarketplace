import { PageShell } from "@/components/ui/page-shell";
import { ProductCardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function PopularLoading() {
  return (
    <PageShell>
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-4 w-28" />
      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Skeleton className="hidden h-[28rem] lg:block" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </PageShell>
  );
}
