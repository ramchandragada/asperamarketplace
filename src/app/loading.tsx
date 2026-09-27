import { ProductCardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="flex flex-col">
      <Skeleton className="h-[min(52vh,28rem)] w-full rounded-none" />
      <div className="border-b border-border bg-white py-2.5">
        <div className="container-shell flex justify-center gap-6">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="container-shell grid gap-4 py-10 md:grid-cols-2">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square rounded-full" />
          ))}
        </div>
      </div>
      <div className="container-shell grid grid-cols-2 gap-3 py-8 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
