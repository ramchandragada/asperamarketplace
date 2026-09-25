"use client";

export function PdpTrustBadgeRow({
  showMall,
  showOriginal,
}: {
  showMall?: boolean;
  showOriginal?: boolean;
}) {
  const badges = [
    showMall
      ? { key: "mall", label: "Mall", icon: "🏬" }
      : null,
    showOriginal
      ? { key: "original", label: "Aspera Original", icon: "✓" }
      : { key: "original-brand", label: "Original Brand", icon: "✓" },
    { key: "authorised", label: "Authorised Seller", icon: "✓" },
  ].filter(Boolean) as Array<{ key: string; label: string; icon: string }>;

  return (
    <div className="rounded-[var(--radius)] border border-border bg-[#faf8f5] px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs sm:text-sm">
        {badges.map((badge, index) => (
          <span key={badge.key} className="inline-flex items-center gap-1.5 px-1.5">
            {index > 0 ? (
              <span className="mr-1 text-border" aria-hidden>
                |
              </span>
            ) : null}
            <span aria-hidden>{badge.icon}</span>
            <span className="font-semibold text-foreground">{badge.label}</span>
          </span>
        ))}
        <a
          href="/about"
          className="ml-auto inline-flex items-center gap-1 font-medium text-accent hover:underline"
        >
          Learn more <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}
