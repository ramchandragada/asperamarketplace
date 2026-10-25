/**
 * Single source for public support / legal contact shown in footer, checkout,
 * and help surfaces. Override via env in production deployments.
 */
export const siteContact = {
  brandName: "Aspera",
  supportEmail:
    process.env.SITE_SUPPORT_EMAIL?.trim() || "support@asperamarketplace.com",
  supportPhoneDisplay:
    process.env.SITE_SUPPORT_PHONE?.trim() || "+91 80 4680 1200",
  supportPhoneTel:
    process.env.SITE_SUPPORT_PHONE_TEL?.trim() || "+918046801200",
  legalEntity:
    process.env.SITE_LEGAL_ENTITY?.trim() ||
    "Aspera Marketplace Private Limited",
  registeredRegion: process.env.SITE_REGISTERED_REGION?.trim() || "India",
  grievanceEmail:
    process.env.SITE_GRIEVANCE_EMAIL?.trim() ||
    "grievance@asperamarketplace.com",
} as const;

export type SiteContact = typeof siteContact;
