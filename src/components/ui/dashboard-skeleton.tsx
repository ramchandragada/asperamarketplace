import { Skeleton } from "@/components/ui/skeleton";

/** Generic dashboard loading skeleton (header + a grid of cards). */
export function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-8 w-64" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[var(--radius)] border border-border bg-surface p-4"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-7 w-32" />
            <Skeleton className="mt-4 h-20 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
