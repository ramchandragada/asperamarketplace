import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";

export default function NotFound() {
  return (
    <PageShell narrow>
      <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
        404
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold">
        Page not found
      </h1>
      <p className="mt-3 text-muted">
        This link may be outdated, or the page may have moved. Head back to the
        shop and keep browsing.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
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
    </PageShell>
  );
}
