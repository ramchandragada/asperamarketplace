import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-56" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[var(--radius)] border border-border bg-surface p-4"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-7 w-24" />
          </div>
        ))}
      </div>
      <div className="mt-2 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48 w-full rounded-[var(--radius)]" />
        <Skeleton className="h-48 w-full rounded-[var(--radius)]" />
      </div>
    </div>
  );
}
