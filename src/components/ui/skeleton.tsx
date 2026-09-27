export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-[var(--radius-sm)] bg-border/50 ${className}`}
      aria-hidden
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-surface shadow-[var(--shadow-card)]">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-2 p-2.5">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

export function ProductRailSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="rail-scroll" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
