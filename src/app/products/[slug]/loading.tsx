import { PageShell } from "@/components/ui/page-shell";
import { ProductCardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <PageShell className="pb-24 sm:pb-12">
      <Skeleton className="h-3 w-64" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="hidden gap-2 lg:flex lg:w-16 lg:flex-col">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-16" />
            ))}
          </div>
          <Skeleton className="aspect-square w-full rounded-[var(--radius)]" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </PageShell>
  );
}
