import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[var(--radius-card)] border border-dashed border-border bg-surface-raised px-5 py-8">
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? <p className="max-w-xl text-sm text-muted">{description}</p> : null}
      {action}
    </div>
  );
}
