"use client";

/**
 * P0: only honest seller status labels. No Mall / Aspera Original / Featured Store
 * programmes until evidence-backed badge records exist.
 */
export function PdpTrustBadgeRow({
  sellerApproved,
}: {
  sellerApproved?: boolean;
  /** @deprecated Ignored — programme badges removed until verified */
  showFeaturedStore?: boolean;
  showBrandPartner?: boolean;
  showApprovedSeller?: boolean;
}) {
  const approved = sellerApproved ?? false;
  if (!approved) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
      <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 font-semibold text-accent">
        Approved seller
      </span>
    </div>
  );
}
