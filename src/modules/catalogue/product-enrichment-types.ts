/** Flipkart-style structured product content stored on Product.attributes. */

export type SpecRow = { key: string; value: string };

export type SpecGroup = {
  name: string;
  rows: SpecRow[];
};

export type HighlightRow = {
  /** Short hard fact shown as the highlight label (Flipkart left column). */
  label: string;
  /** Optional benefit phrase (Flipkart right column). */
  benefit?: string;
};

export type DescriptionBlock = {
  title: string;
  body: string;
};

export type WarrantyInfo = {
  summary: string;
  covered: string;
  notCovered: string;
  serviceType: string;
};

export type ProductEnrichment = {
  summary: string;
  description: string;
  highlights: HighlightRow[];
  /** Flat map used by the existing purchase-panel highlights table. */
  highlightMap: Record<string, string>;
  specificationGroups: SpecGroup[];
  descriptionBlocks: DescriptionBlock[];
  warranty: WarrantyInfo;
  cardBullets: string[];
  source: "mdcomputers" | "flipkart" | "derived";
};

export type EnrichmentAttributes = {
  brand: string;
  city: string;
  source: ProductEnrichment["source"];
  highlights: Record<string, string>;
  highlightRows: HighlightRow[];
  specificationGroups: SpecGroup[];
  descriptionBlocks: DescriptionBlock[];
  warranty: WarrantyInfo;
  cardBullets: string[];
};
