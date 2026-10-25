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
        Express orders are prepaid and protected — get help if delivery misses
        the quoted ETA window, an item is not as described, or a return is not
        honoured.
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
