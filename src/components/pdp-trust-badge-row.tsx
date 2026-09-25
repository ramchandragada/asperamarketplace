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
      ? {
          key: "mall",
          label: "Mall",
          icon: "🏬",
          className: "bg-[#e8f1ff] text-[#1d4ed8]",
        }
      : null,
    showOriginal
      ? {
          key: "original",
          label: "Aspera Original",
          icon: "✓",
          className: "bg-success-soft text-success",
        }
      : {
          key: "original-brand",
          label: "Original Brand",
          icon: "✓",
          className: "bg-success-soft text-success",
        },
    {
      key: "authorised",
      label: "Authorised Seller",
      icon: "🛡️",
      className: "bg-[#f3f4f6] text-[#4b5563]",
    },
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    icon: string;
    className: string;
  }>;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
      {badges.map((badge, index) => (
        <span key={badge.key} className="inline-flex items-center gap-1">
          {index > 0 ? (
            <span className="mx-0.5 text-border" aria-hidden>
              |
            </span>
          ) : null}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${badge.className}`}
          >
            <span aria-hidden>{badge.icon}</span>
            {badge.label}
          </span>
        </span>
      ))}
    </div>
  );
}
