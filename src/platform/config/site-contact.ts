/**
 * Public support / legal contact shown in footer, checkout, and help.
 * Legal entity fields are owned by aspera-legal.ts — do not reintroduce
 * "Aspera Marketplace Private Limited".
 */
import { asperaLegal } from "@/platform/config/aspera-legal";

export const siteContact = {
  brandName: asperaLegal.brandName,
  supportEmail: asperaLegal.supportEmail,
  supportPhoneDisplay: asperaLegal.supportPhoneDisplay,
  supportPhoneTel: asperaLegal.supportPhoneTel,
  legalEntity: asperaLegal.legalEntity,
  registeredRegion: asperaLegal.state,
  grievanceEmail: asperaLegal.grievanceEmail,
  cin: asperaLegal.cin,
  pan: asperaLegal.pan,
  gstinRegular: asperaLegal.gstinRegular,
  gstinTcs: asperaLegal.gstinTcs,
} as const;

export type SiteContact = typeof siteContact;
