import Link from "next/link";

export function BuyerProtectionBadge({
  compact = false,
}: {
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Link
        href="/buyer-protection"
        className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[12px] font-semibold text-accent hover:underline"
      >
        Buyer Protection
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 text-sm shadow-[var(--shadow-card)]">
      <p className="font-semibold text-foreground">Buyer Protection</p>
      <p className="mt-1 text-muted">
        Get help if your order never arrives, is not as described, or a return
        is not honoured — Aspera reviews eligible claims.
      </p>
      <Link
        href="/buyer-protection"
        className="mt-2 inline-flex font-semibold text-accent hover:underline"
      >
        How it works →
      </Link>
    </div>
  );
}
