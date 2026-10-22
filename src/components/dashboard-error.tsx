"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Shared error boundary UI for the signed-in dashboard segments. */
export function DashboardError({
  error,
  reset,
  homeHref,
  homeLabel,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref: string;
  homeLabel: string;
}) {
  useEffect(() => {
    console.error("Dashboard error boundary", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-3xl flex-col justify-center px-4 py-12 md:px-6">
      <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
        Something went wrong
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold">
        This page couldn&apos;t load
      </h1>
      <p className="mt-3 max-w-lg text-muted">
        A temporary issue interrupted this page. Try again, or go back to your
        dashboard.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
        >
          Try again
        </button>
        <Link
          href={homeHref}
          className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] border border-border px-4 py-2 text-sm font-semibold text-foreground"
        >
          {homeLabel}
        </Link>
      </div>
    </main>
  );
}
