import type { ReactNode } from "react";

export function PageShell({
  children,
  className = "",
  narrow = false,
}: {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <main
      className={`container-shell flex min-h-[70vh] w-full flex-col gap-8 py-8 md:py-12 ${narrow ? "max-w-3xl" : ""} ${className}`}
    >
      {children}
    </main>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-0.5 text-[22px] font-bold tracking-tight md:text-[24px] md:leading-[32px]">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-sm leading-5 text-muted md:text-[15px] md:leading-6">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
