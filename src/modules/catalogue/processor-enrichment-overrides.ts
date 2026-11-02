/**
 * Curated processor enrichment from Intel ARK + India retail Boxed listings
 * (PrimeABGB / MD Computers). Prose is Aspera voice — not copied verbatim.
 */
import type { ProductEnrichment } from "@/modules/catalogue/product-enrichment-types";

function cpu(
  partial: Omit<ProductEnrichment, "highlightMap" | "cardBullets"> & {
    cardBullets?: string[];
  },
): ProductEnrichment {
  const highlightMap: Record<string, string> = {};
  for (const row of partial.highlights) {
    highlightMap[row.label] = row.benefit ?? row.label;
  }
  return {
    ...partial,
    highlightMap,
    cardBullets:
      partial.cardBullets ??
      partial.highlights.slice(0, 5).map((h) => h.label),
  };
}

export const PROCESSOR_ENRICHMENT_OVERRIDES: Record<string, ProductEnrichment> = {
  "intel-core-i3-12100f-processor": cpu({
    source: "derived",
    summary:
      "Budget 12th Gen Intel Core for LGA 1700 DIY builds — 4P/8T up to 4.30 GHz, DDR4 or DDR5. F-series needs a discrete GPU. Boxed retail includes Intel Laminar RM1.",
    description:
      "Intel Core i3-12100F (Alder Lake) is a 12th Gen desktop CPU with 4 performance cores / 8 threads, up to 4.30 GHz turbo, 12 MB L3, and no integrated graphics. Pair with an LGA 1700 board (H610/B660/H670/Z690 or 700-series), DDR4 or DDR5 matching the board, and a discrete GPU before first boot. This listing is the Boxed retail OPN BX8071512100F with Laminar RM1 cooler and 3-year brand warranty. Sold on Aspera by verified sellers with Express fulfilment when in stock.",
    highlights: [
      {
        label: "Intel Core i3-12100F",
        benefit: "12th Gen Alder Lake · 4P-cores / 8 threads",
      },
      {
        label: "3.30 / 4.30 GHz",
        benefit: "Base · max turbo (Turbo Boost 2.0)",
      },
      {
        label: "Socket · LGA 1700",
        benefit: "600- and 700-series chipsets",
      },
      {
        label: "No integrated graphics",
        benefit: "Dedicated GPU required",
      },
      {
        label: "Boxed · Laminar RM1",
        benefit: "OPN BX8071512100F · 3-year warranty",
      },
    ],
    cardBullets: [
      "i3-12100F · 4C/8T · up to 4.30 GHz",
      "LGA 1700 · DDR4 / DDR5",
      "Needs discrete GPU",
      "Boxed + Laminar RM1",
      "3-year brand warranty",
    ],
    descriptionBlocks: [
      {
        title: "Built for budget LGA 1700 platforms",
        body: "Four P-cores with Hyper-Threading deliver smooth home, office, and entry gaming when paired with a discrete GPU. Confirm your motherboard’s CPU support list and BIOS version for 12th Gen before install.",
      },
      {
        title: "Memory, power, and cooler",
        body: "Supports up to DDR5-4800 or DDR4-3200 (board chooses generation), 128 GB max, dual-channel. Processor base power 58 W / max turbo 89 W. Boxed unit ships with Intel Laminar RM1 — enough for stock clocks.",
      },
      {
        title: "No integrated graphics",
        body: "F-suffix CPUs have no iGPU. Fit a dedicated graphics card before first boot, including BIOS setup on boards without CPU graphics fallback.",
      },
    ],
    specificationGroups: [
      {
        name: "Identity",
        rows: [
          { key: "Brand", value: "Intel" },
          { key: "Family / series", value: "12th Generation Intel Core i3 Processors" },
          { key: "Model", value: "i3-12100F" },
          { key: "Suffix variant", value: "F" },
          { key: "Generation", value: "12th Gen" },
          { key: "Code name", value: "Alder Lake" },
          { key: "Vertical segment", value: "Desktop" },
          { key: "MPN / OPN", value: "BX8071512100F" },
          { key: "GTIN / EAN", value: "5032037238731" },
          { key: "HSN", value: "8542" },
          { key: "S-Spec", value: "SRL63" },
        ],
      },
      {
        name: "Performance",
        rows: [
          { key: "Total cores", value: "4" },
          { key: "P-cores / E-cores", value: "4 / 0" },
          { key: "Threads", value: "8" },
          { key: "Base clock", value: "3.30 GHz" },
          { key: "Max turbo frequency", value: "4.30 GHz" },
          { key: "L3 cache", value: "12 MB" },
          { key: "L2 cache", value: "5 MB" },
          { key: "Bus / DMI", value: "DMI 4.0 · 8 lanes" },
          { key: "Lithography", value: "Intel 7" },
        ],
      },
      {
        name: "Compatibility",
        rows: [
          { key: "Socket", value: "FCLGA1700" },
          {
            key: "Compatible chipsets",
            value: "H610, B660, H670, Z690, Q670, W680, B760, H770, Z790",
          },
          { key: "Memory types", value: "DDR4-3200 / DDR5-4800" },
          { key: "Max memory", value: "128 GB" },
          { key: "Memory channels", value: "2" },
          { key: "Max memory bandwidth", value: "76.8 GB/s" },
          { key: "ECC support", value: "No" },
          { key: "PCI Express", value: "5.0 and 4.0 · up to 20 lanes" },
          { key: "PCIe configurations", value: "Up to 1x16+4, 2x8+4" },
        ],
      },
      {
        name: "Graphics",
        rows: [
          { key: "Integrated graphics", value: "No" },
          { key: "Buyer note", value: "No integrated graphics — dedicated GPU required" },
        ],
      },
      {
        name: "Power And Thermal",
        rows: [
          { key: "Processor base power", value: "58 W" },
          { key: "Maximum turbo power", value: "89 W" },
          { key: "Tjunction", value: "100 °C" },
          { key: "Thermal solution spec", value: "PCG 2020C" },
          { key: "Cooler included", value: "Yes — Intel Laminar RM1" },
        ],
      },
      {
        name: "Features",
        rows: [
          { key: "Overclocking", value: "No (locked multiplier)" },
          { key: "Hyper-Threading", value: "Yes" },
          { key: "Virtualization", value: "VT-x, VT-d, VT-x with EPT" },
          { key: "Instruction set", value: "64-bit" },
          { key: "Extensions", value: "SSE4.1, SSE4.2, AVX2" },
          { key: "Launch", value: "Q1'22" },
          { key: "Turbo Boost Max 3.0", value: "No" },
          { key: "Optane memory supported", value: "Yes" },
          { key: "SpeedStep / idle states", value: "Yes" },
          { key: "Scalability", value: "1S Only" },
        ],
      },
      {
        name: "Packaging And Warranty",
        rows: [
          { key: "Packaging", value: "Boxed" },
          { key: "Package size (CPU)", value: "45.0 mm x 37.5 mm" },
          {
            key: "Box contents",
            value: "Processor, Intel Laminar RM1 cooler, user manual",
          },
          { key: "Warranty", value: "3 Years" },
          { key: "Condition", value: "New" },
        ],
      },
      {
        name: "Browse filters",
        rows: [
          { key: "Brand family", value: "Intel Core" },
          { key: "Series / tier", value: "Core i3 / Ultra 3" },
          { key: "Socket", value: "LGA 1700" },
          { key: "Memory type", value: "DDR4 / DDR5" },
          { key: "Integrated graphics", value: "No (needs GPU)" },
        ],
      },
    ],
    warranty: {
      summary: "3 Years brand warranty (Boxed retail)",
      covered: "Manufacturing defects under Intel boxed-processor terms",
      notCovered: "Bent pins, overclock damage, physical abuse, tray/OEM mismatches",
      serviceType: "Brand RMA / seller facilitation",
    },
  }),
};
