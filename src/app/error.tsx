"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error boundary", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="container-shell flex min-h-[60vh] flex-col justify-center py-12">
      <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
        Something went wrong
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold">
        This page couldn&apos;t load
      </h1>
      <p className="mt-3 max-w-lg text-muted">
        A temporary server issue interrupted this page. Your cart and account
        are usually fine — try again, or return to the homepage.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex rounded-[var(--radius-sm)] border border-border px-4 py-2 text-sm font-semibold text-foreground"
        >
          Go to homepage
        </Link>
        <Link
          href="/shop"
          className="inline-flex rounded-[var(--radius-sm)] border border-border px-4 py-2 text-sm font-semibold text-foreground"
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
