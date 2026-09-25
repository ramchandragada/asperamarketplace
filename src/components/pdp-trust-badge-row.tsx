"use client";

export function PdpTrustBadgeRow({
  showFeaturedStore,
  showBrandPartner,
  showApprovedSeller,
}: {
  showFeaturedStore?: boolean;
  showBrandPartner?: boolean;
  showApprovedSeller?: boolean;
}) {
  const badges = [
    showFeaturedStore
      ? {
          key: "featured",
          label: "Featured Store",
          className: "bg-accent-soft text-accent",
        }
      : null,
    showBrandPartner
      ? {
          key: "brand-partner",
          label: "Brand Partners",
          className: "bg-success-soft text-success",
        }
      : null,
    showApprovedSeller
      ? {
          key: "approved",
          label: "Verified Business Seller",
          className: "bg-[#f3f4f6] text-[#4b5563]",
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    className: string;
  }>;

  if (badges.length === 0) return null;

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
            {badge.label}
          </span>
        </span>
      ))}
    </div>
  );
}
