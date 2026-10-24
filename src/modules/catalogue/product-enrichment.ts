import { LAPTOP_ENRICHMENT_OVERRIDES } from "@/modules/catalogue/laptop-enrichment-overrides";
import type {
  DescriptionBlock,
  EnrichmentAttributes,
  HighlightRow,
  ProductEnrichment,
  SpecGroup,
  WarrantyInfo,
} from "@/modules/catalogue/product-enrichment-types";

export type EnrichableProduct = {
  slug: string;
  title: string;
  categorySlug: string;
  brandSlug: string;
  categoryName?: string;
  brandName?: string;
};

const DEFAULT_WARRANTY: WarrantyInfo = {
  summary: "6–12 months seller / brand warranty (see listing)",
  covered: "Manufacturing defects under brand or seller policy",
  notCovered: "Physical damage, liquid spill, burn, misuse",
  serviceType: "Seller-facilitated / brand carry-in as applicable",
};

function categoryLabel(slug: string, fallback?: string) {
  return (
    fallback ??
    ({
      processors: "Processors (CPU)",
      motherboards: "Motherboards",
      "graphics-cards": "Graphics Cards",
      "memory-ram": "Memory (RAM)",
      "storage-ssd": "SSD & Storage",
      cabinets: "Cabinets",
      "power-supplies": "Power Supplies (SMPS)",
      "cpu-coolers": "CPU Coolers",
      "keyboard-mouse": "Keyboard & Mouse",
      monitors: "Monitors",
      ups: "UPS & Power Backup",
      laptops: "Laptops",
    }[slug] ?? "PC components")
  );
}

function brandDisplay(slug: string, name?: string) {
  if (name) return name;
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function match(title: string, re: RegExp): string | null {
  const m = title.match(re);
  return m?.[1]?.trim() ?? null;
}

function highlightMapFrom(rows: HighlightRow[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.label] = row.benefit ?? row.label;
  }
  return map;
}

function pack(args: {
  source: ProductEnrichment["source"];
  summary: string;
  description: string;
  highlights: HighlightRow[];
  specificationGroups: SpecGroup[];
  descriptionBlocks: DescriptionBlock[];
  warranty?: WarrantyInfo;
  cardBullets?: string[];
}): ProductEnrichment {
  return {
    source: args.source,
    summary: args.summary,
    description: args.description,
    highlights: args.highlights,
    highlightMap: highlightMapFrom(args.highlights),
    specificationGroups: args.specificationGroups,
    descriptionBlocks: args.descriptionBlocks,
    warranty: args.warranty ?? DEFAULT_WARRANTY,
    cardBullets:
      args.cardBullets ?? args.highlights.slice(0, 5).map((h) => h.label),
  };
}

function deriveProcessors(p: EnrichableProduct): ProductEnrichment {
  const brand = brandDisplay(p.brandSlug, p.brandName);
  const socket =
    match(p.title, /\b(AM[45]|AM5|LGA\s?\d{3,4}|sTRX4|TR4)\b/i) ??
    (/\bryzen\b/i.test(p.title) ? "AM4/AM5 (check model)" : "LGA (check model)");
  const cores = match(p.title, /(\d+)\s*-?\s*core/i);
  const graphics = /\b(vega|radeon|uhd|iris)\b/i.test(p.title)
    ? "Integrated graphics"
    : /F\b|without graphics|no igpu/i.test(p.title)
      ? "Requires discrete GPU"
      : null;
  const highlights: HighlightRow[] = [
    { label: p.title.replace(/\s+Processor.*$/i, "").slice(0, 48), benefit: "Desktop CPU for DIY builds" },
    { label: `Brand · ${brand}`, benefit: "Genuine boxed / tray as listed" },
    { label: `Socket · ${socket}`, benefit: "Match to your motherboard" },
  ];
  if (cores) highlights.push({ label: `${cores} cores`, benefit: "Parallel workloads" });
  if (graphics) highlights.push({ label: graphics, benefit: "Check cooler & board support" });
  else highlights.push({ label: "Desktop platform", benefit: "Pair with cooler & motherboard" });

  return pack({
    source: "derived",
    summary: `${p.title} — genuine ${categoryLabel(p.categorySlug).toLowerCase()} for Indian DIY and gaming builds.`,
    description: `${p.title} is listed on Aspera Express for builders who want clear India street pricing and verified sellers. Confirm socket, chipset, cooler clearance, and memory support before checkout. Prepaid Express delivery from nearby hubs when in stock.`,
    highlights: highlights.slice(0, 5),
    descriptionBlocks: [
      {
        title: "Compatibility first",
        body: `Match this ${brand} processor to a supported motherboard chipset and BIOS. Check cooler TDP rating and case clearance before you buy.`,
      },
      {
        title: "Aspera Express fulfilment",
        body: "In-stock CPUs from approved sellers ship with minute-level ETAs in Pune Express hubs and clear same-day windows in major metros.",
      },
    ],
    specificationGroups: [
      {
        name: "General",
        rows: [
          { key: "Brand", value: brand },
          { key: "Type", value: "Desktop Processor" },
          { key: "Model", value: p.title },
        ],
      },
      {
        name: "Processor Features",
        rows: [
          { key: "Socket", value: socket },
          ...(cores ? [{ key: "Cores", value: cores }] : []),
          ...(graphics ? [{ key: "Graphics", value: graphics }] : []),
        ],
      },
    ],
    warranty: {
      summary: "Brand box warranty as printed (typically 3 years for retail CPU)",
      covered: "Manufacturing defects under brand terms",
      notCovered: "Bent pins, overclock damage, physical abuse",
      serviceType: "Brand RMA / seller facilitation",
    },
  });
}

function deriveMotherboard(p: EnrichableProduct): ProductEnrichment {
  const brand = brandDisplay(p.brandSlug, p.brandName);
  const form =
    match(p.title, /\b(E-?ATX|Micro-?ATX|M-?ATX|Mini-?ITX|ITX|ATX)\b/i) ??
    "ATX / mATX (see title)";
  const memory =
    match(p.title, /\b(DDR5|DDR4)\b/i) ?? "DDR4/DDR5 (see title)";
  const chipset =
    match(p.title, /\b([ABZHX]\d{3}[A-Z]?|[BbXxZz]\d{3})\b/) ?? "See model";
  const highlights: HighlightRow[] = [
    { label: `${brand} · ${chipset}`, benefit: "Chipset for your CPU generation" },
    { label: memory, benefit: "Install matching RAM kits" },
    { label: form.replace(/micro-?/i, "m").toUpperCase(), benefit: "Case form-factor fit" },
    { label: "DIY motherboard", benefit: "Verify CPU socket & BIOS" },
    { label: "Verified seller", benefit: "Aspera Express when in hub" },
  ];
  return pack({
    source: "derived",
    summary: `${p.title} — ${memory} board for Indian DIY builds.`,
    description: `${p.title} is stocked on Aspera for builders matching CPU, RAM generation, and case size. Confirm socket, VRM needs, and rear I/O before purchase. Express delivery from approved sellers.`,
    highlights,
    descriptionBlocks: [
      {
        title: "Match CPU, RAM, and case",
        body: `This ${brand} board is listed as ${memory} with ${form} sizing. Cross-check the CPU socket and QVL before you add memory kits.`,
      },
    ],
    specificationGroups: [
      {
        name: "General",
        rows: [
          { key: "Brand", value: brand },
          { key: "Model", value: p.title },
          { key: "Form Factor", value: form },
        ],
      },
      {
        name: "Memory And Chipset",
        rows: [
          { key: "Chipset", value: chipset },
          { key: "Memory Type", value: memory },
        ],
      },
    ],
  });
}

function deriveGpu(p: EnrichableProduct): ProductEnrichment {
  const brand = brandDisplay(p.brandSlug, p.brandName);
  const vram =
    match(p.title, /(\d+)\s*GB\s*(GDDR\dX?|DDR\d)/i) ??
    match(p.title, /(\d+)\s*GB/i);
  const series =
    match(p.title, /\b(RTX\s?\d{3,4}|RX\s?\d{3,4}|GT\s?\d{3,4}|GTX\s?\d{3,4})\b/i) ??
    "Graphics card";
  const memType = match(p.title, /\b(GDDR6X|GDDR6|GDDR5|DDR5|DDR4)\b/i);
  const highlights: HighlightRow[] = [
    { label: series, benefit: "Discrete GPU for gaming & creation" },
    {
      label: vram ? `${vram}${memType ? ` ${memType}` : " VRAM"}` : `${brand} GPU`,
      benefit: "Check PSU wattage & PCIe power",
    },
    { label: brand, benefit: "Board partner / Founders-style as listed" },
    { label: "PCIe desktop card", benefit: "Needs case clearance & cooler space" },
    { label: "Express eligible", benefit: "When stocked in a nearby hub" },
  ];
  return pack({
    source: "derived",
    summary: `${p.title} — discrete GPU for DIY gaming and creation builds.`,
    description: `${p.title} is listed with India street-aligned pricing on Aspera Express. Confirm PSU connectors, case length clearance, and CPU bottleneck before checkout.`,
    highlights,
    descriptionBlocks: [
      {
        title: "Power and fit checklist",
        body: "Verify your PSU has the right PCIe power cables and that the card fits your case. Pair with a capable CPU for balanced gaming frames.",
      },
    ],
    specificationGroups: [
      {
        name: "General",
        rows: [
          { key: "Brand", value: brand },
          { key: "Model", value: p.title },
          { key: "Series", value: series },
        ],
      },
      {
        name: "Memory Features",
        rows: [
          ...(vram ? [{ key: "Dedicated Memory", value: `${vram} GB` }] : []),
          ...(memType ? [{ key: "Memory Type", value: memType }] : []),
        ],
      },
    ],
    warranty: {
      summary: "Brand warranty as on box (commonly 2–3 years)",
      covered: "Manufacturing defects under brand terms",
      notCovered: "Mining abuse, physical damage, modified BIOS (brand dependent)",
      serviceType: "Brand RMA / seller facilitation",
    },
  });
}

function deriveRam(p: EnrichableProduct): ProductEnrichment {
  const brand = brandDisplay(p.brandSlug, p.brandName);
  const size = match(p.title, /(\d+)\s*GB/i);
  const speed = match(p.title, /(\d{3,5})\s*MHz/i);
  const type = match(p.title, /\b(DDR5|DDR4|LPDDR5|LPDDR4X)\b/i) ?? "DDR4/DDR5";
  const cl = match(p.title, /\bCL(\d+)\b/i);
  const laptop = /\blaptop\b/i.test(p.title);
  const highlights: HighlightRow[] = [
    { label: size ? `${size} GB ${type}` : type, benefit: laptop ? "SO-DIMM laptop memory" : "Desktop DIMM kit" },
    ...(speed ? [{ label: `${speed} MHz`, benefit: "Match motherboard QVL" }] : []),
    ...(cl ? [{ label: `CL${cl}`, benefit: "Latency rating" }] : []),
    { label: brand, benefit: "Kit as listed (single/dual)" },
    { label: laptop ? "Laptop RAM" : "Desktop RAM", benefit: "Form factor must match" },
  ];
  return pack({
    source: "derived",
    summary: `${p.title} — ${type} memory for Indian DIY builds.`,
    description: `${p.title} is stocked for upgrades and new builds. Confirm motherboard/laptop memory generation, max speed, and slot count before buying.`,
    highlights: highlights.slice(0, 5),
    descriptionBlocks: [
      {
        title: "Generation and slots",
        body: `Install only ${type} modules your board or laptop supports. Mixing sizes/speeds can force downclocking.`,
      },
    ],
    specificationGroups: [
      {
        name: "Memory Features",
        rows: [
          { key: "Brand", value: brand },
          { key: "Memory Type", value: type },
          ...(size ? [{ key: "Capacity", value: `${size} GB` }] : []),
          ...(speed ? [{ key: "Frequency", value: `${speed} MHz` }] : []),
          ...(cl ? [{ key: "CAS Latency", value: `CL${cl}` }] : []),
          { key: "Form Factor", value: laptop ? "SO-DIMM" : "DIMM" },
        ],
      },
    ],
  });
}

function deriveStorage(p: EnrichableProduct): ProductEnrichment {
  const brand = brandDisplay(p.brandSlug, p.brandName);
  const interface_ =
    match(p.title, /\b(NVMe|PCIe\s?Gen?\s?\d|SATA|USB\s?\d(?:\.\d)?|MicroSD|SD)\b/i) ??
    (/\bssd\b/i.test(p.title) ? "SSD" : "Storage");
  const capLabel = match(p.title, /(\d+\s*(?:TB|GB))/i);
  const highlights: HighlightRow[] = [
    {
      label: capLabel ?? brand,
      benefit: "Capacity as listed in title",
    },
    { label: String(interface_), benefit: "Interface / form factor" },
    { label: brand, benefit: "Retail packaged storage" },
    { label: "DIY / upgrade ready", benefit: "Check bay or M.2 slot" },
    { label: "Express stock", benefit: "When available in hub" },
  ];

  return pack({
    source: "derived",
    summary: `${p.title} — storage for builds and upgrades.`,
    description: `${p.title} from ${brand} is listed on Aspera Express. Confirm M.2 keying, SATA ports, or USB host support before checkout.`,
    highlights,
    descriptionBlocks: [
      {
        title: "Install notes",
        body: "Back up data before swapping drives. For NVMe, confirm your motherboard M.2 slot generation and heatsink clearance.",
      },
    ],
    specificationGroups: [
      {
        name: "Storage Features",
        rows: [
          { key: "Brand", value: brand },
          { key: "Model", value: p.title },
          ...(capLabel ? [{ key: "Capacity", value: capLabel }] : []),
          { key: "Interface", value: String(interface_) },
        ],
      },
    ],
  });
}

function deriveCabinet(p: EnrichableProduct): ProductEnrichment {
  const brand = brandDisplay(p.brandSlug, p.brandName);
  const form =
    match(p.title, /\b(Full\s*Tower|Mid\s*Tower|Mini\s*Tower|M-?ATX|ITX|ATX)\b/i) ??
    "PC case";
  const highlights: HighlightRow[] = [
    { label: form, benefit: "Supports matching motherboard sizes" },
    { label: brand, benefit: "Chassis as pictured" },
    {
      label: /\b(ARGB|RGB)\b/i.test(p.title) ? "RGB / ARGB ready" : "Airflow focused",
      benefit: "Lighting / cooling as titled",
    },
    { label: "DIY cabinet", benefit: "Check GPU length & radiator support" },
    { label: "Express shipping", benefit: "Larger items may use full ETA window" },
  ];
  return pack({
    source: "derived",
    summary: `${p.title} — PC chassis for DIY builds.`,
    description: `${p.title} is listed for new builds. Verify GPU clearance, radiator mounts, and cable management before pairing with your parts list.`,
    highlights,
    descriptionBlocks: [
      {
        title: "Fitment checklist",
        body: "Measure GPU length, cooler height, and PSU type (ATX/SFX) against this case’s published limits.",
      },
    ],
    specificationGroups: [
      {
        name: "General",
        rows: [
          { key: "Brand", value: brand },
          { key: "Model", value: p.title },
          { key: "Form Factor Support", value: form },
        ],
      },
    ],
  });
}

function derivePsu(p: EnrichableProduct): ProductEnrichment {
  const brand = brandDisplay(p.brandSlug, p.brandName);
  const watts = match(p.title, /(\d{3,4})\s*(?:W|Watt)/i);
  const cert = match(p.title, /\b(Platinum|Gold|Silver|Bronze|White)\b/i);
  const highlights: HighlightRow[] = [
    { label: watts ? `${watts} W` : "PSU", benefit: "Size your GPU + CPU draw" },
    ...(cert ? [{ label: `${cert} rated`, benefit: "Efficiency certification" }] : []),
    { label: brand, benefit: "SMPS as listed" },
    { label: "ATX power supply", benefit: "Confirm modular cables if needed" },
    { label: "Build essential", benefit: "Pair with case PSU shroud" },
  ];
  return pack({
    source: "derived",
    summary: `${p.title} — power supply for DIY PCs.`,
    description: `${p.title} is stocked for new builds and upgrades. Use a PSU calculator for GPU + CPU headroom and confirm connector types.`,
    highlights: highlights.slice(0, 5),
    descriptionBlocks: [
      {
        title: "Wattage headroom",
        body: "Leave 20–30% headroom above expected system load for transient spikes and future upgrades.",
      },
    ],
    specificationGroups: [
      {
        name: "Power Supply Features",
        rows: [
          { key: "Brand", value: brand },
          { key: "Model", value: p.title },
          ...(watts ? [{ key: "Wattage", value: `${watts} W` }] : []),
          ...(cert ? [{ key: "Efficiency", value: cert }] : []),
        ],
      },
    ],
  });
}

function deriveCooler(p: EnrichableProduct): ProductEnrichment {
  const brand = brandDisplay(p.brandSlug, p.brandName);
  const aio = /\b(AIO|liquid|360|280|240|120)\b/i.test(p.title);
  const size = match(p.title, /\b(360|280|240|120)\s*mm\b/i);
  const highlights: HighlightRow[] = [
    { label: aio ? "Liquid / AIO cooler" : "Air cooler", benefit: "Match CPU TDP" },
    ...(size ? [{ label: `${size} mm`, benefit: "Radiator / fan size" }] : []),
    { label: brand, benefit: "Cooler kit as listed" },
    { label: "Socket support", benefit: "Check AM4/AM5/LGA list" },
    { label: "Case clearance", benefit: "Measure height / radiator mounts" },
  ];
  return pack({
    source: "derived",
    summary: `${p.title} — CPU cooling for DIY builds.`,
    description: `${p.title} from ${brand}. Confirm socket brackets and case radiator/air clearance before ordering.`,
    highlights: highlights.slice(0, 5),
    descriptionBlocks: [
      {
        title: "Compatibility",
        body: "Air coolers need height clearance; AIOs need free radiator mounts and pump orientation planning.",
      },
    ],
    specificationGroups: [
      {
        name: "Cooler Features",
        rows: [
          { key: "Brand", value: brand },
          { key: "Model", value: p.title },
          { key: "Type", value: aio ? "Liquid / AIO" : "Air" },
          ...(size ? [{ key: "Size", value: `${size} mm` }] : []),
        ],
      },
    ],
  });
}

function derivePeripherals(p: EnrichableProduct): ProductEnrichment {
  const brand = brandDisplay(p.brandSlug, p.brandName);
  const wireless = /\b(wireless|bluetooth|2\.4)\b/i.test(p.title);
  const type = /\bkeyboard\b/i.test(p.title)
    ? "Keyboard"
    : /\bmouse\b/i.test(p.title)
      ? "Mouse"
      : "Peripheral";
  const highlights: HighlightRow[] = [
    { label: `${brand} ${type}`, benefit: "Plug-and-play accessory" },
    { label: wireless ? "Wireless" : "Wired", benefit: "Connection type" },
    { label: "PC compatible", benefit: "USB / BT as listed" },
    { label: "Express ready", benefit: "Fast delivery in hubs" },
    { label: "Retail kit", value: "As pictured" } as HighlightRow,
  ];
  // fix mistaken value key
  highlights[4] = { label: "Retail kit", benefit: "As pictured" };
  return pack({
    source: "derived",
    summary: `${p.title} — ${type.toLowerCase()} for work and play.`,
    description: `${p.title} from ${brand}. Check wireless dongle/BT needs and hand size preference before buying.`,
    highlights,
    descriptionBlocks: [
      {
        title: "Setup",
        body: wireless
          ? "Insert the receiver or pair via Bluetooth as documented by the brand."
          : "Connect via USB and install brand software only if you need macros/RGB.",
      },
    ],
    specificationGroups: [
      {
        name: "General",
        rows: [
          { key: "Brand", value: brand },
          { key: "Type", value: type },
          { key: "Connectivity", value: wireless ? "Wireless" : "Wired" },
          { key: "Model", value: p.title },
        ],
      },
    ],
  });
}

function deriveMonitor(p: EnrichableProduct): ProductEnrichment {
  const brand = brandDisplay(p.brandSlug, p.brandName);
  const size = match(p.title, /(\d{2}(?:\.\d+)?)\s*(?:Inch|inch|")/);
  const res =
    match(p.title, /\b(4K|UHD|QHD|WQHD|FHD|Full\s*HD|1080p|1440p|2160p)\b/i) ??
    null;
  const hz = match(p.title, /(\d{2,3})\s*Hz/i);
  const highlights: HighlightRow[] = [
    { label: size ? `${size} Inch` : `${brand} monitor`, benefit: "Panel size" },
    ...(res ? [{ label: res, benefit: "Resolution class" }] : []),
    ...(hz ? [{ label: `${hz} Hz`, benefit: "Refresh rate" }] : []),
    { label: brand, benefit: "Display as listed" },
    { label: "Desktop monitor", benefit: "Check HDMI/DP on your GPU" },
  ];
  return pack({
    source: "derived",
    summary: `${p.title} — monitor for work and gaming.`,
    description: `${p.title} from ${brand}. Confirm stand ergonomics and cable (HDMI/DP) compatibility with your GPU or laptop.`,
    highlights: highlights.slice(0, 5),
    descriptionBlocks: [
      {
        title: "Connectivity",
        body: "Most modern GPUs use DisplayPort or HDMI. Bring the right cable if not included.",
      },
    ],
    specificationGroups: [
      {
        name: "Display Features",
        rows: [
          { key: "Brand", value: brand },
          { key: "Model", value: p.title },
          ...(size ? [{ key: "Screen Size", value: `${size} Inch` }] : []),
          ...(res ? [{ key: "Resolution", value: res }] : []),
          ...(hz ? [{ key: "Refresh Rate", value: `${hz} Hz` }] : []),
        ],
      },
    ],
  });
}

function deriveUps(p: EnrichableProduct): ProductEnrichment {
  const brand = brandDisplay(p.brandSlug, p.brandName);
  const va = match(p.title, /(\d{3,4})\s*VA/i);
  const highlights: HighlightRow[] = [
    { label: va ? `${va} VA` : "UPS", benefit: "Match to PC + monitor load" },
    { label: brand, benefit: "Line-interactive / online as titled" },
    { label: "Power backup", benefit: "Safe shutdown headroom" },
    { label: "Home / office", benefit: "Place with ventilation" },
    { label: "Express freight", benefit: "Heavier SKUs use full ETA window" },
  ];
  return pack({
    source: "derived",
    summary: `${p.title} — UPS backup for PCs.`,
    description: `${p.title} from ${brand}. Size VA rating above PC + monitor wattage and allow battery recharge clearance.`,
    highlights,
    descriptionBlocks: [
      {
        title: "Sizing tip",
        body: "Convert VA to watts with the UPS power factor, then keep PC load under ~60% for healthy runtime.",
      },
    ],
    specificationGroups: [
      {
        name: "UPS Features",
        rows: [
          { key: "Brand", value: brand },
          { key: "Model", value: p.title },
          ...(va ? [{ key: "Capacity", value: `${va} VA` }] : []),
        ],
      },
    ],
  });
}

function deriveGenericLaptop(p: EnrichableProduct): ProductEnrichment {
  const brand = brandDisplay(p.brandSlug, p.brandName);
  const cpu =
    match(
      p.title,
      /\b((?:Intel\s+)?Core\s+(?:Ultra\s+)?[i3i5i7i9\d][^\s/,)]*|(?:AMD\s+)?Ryzen\s+\d[^\s/,)]*)/i,
    ) ?? "Laptop CPU";
  const ram = match(p.title, /(\d+)\s*GB(?:-|\s*)?(DDR\d|LPDDR\d)?/i);
  const highlights: HighlightRow[] = [
    { label: cpu, benefit: "Processor as listed in title" },
    {
      label: ram ? `${ram} RAM` : `${brand} laptop`,
      benefit: "Memory configuration from title",
    },
    { label: brand, benefit: "Notebook as pictured" },
    { label: "Portable PC", benefit: "Check ports & webcam needs" },
    { label: "Express hubs", benefit: "Minute ETAs when in zone" },
  ];
  return pack({
    source: "derived",
    summary: `${p.title} — laptop on Aspera Express.`,
    description: `${p.title}. Specs below are derived from the listing title where a full MD Computers / Flipkart specification sheet was unavailable. Prefer curated laptop pages when present.`,
    highlights,
    descriptionBlocks: [
      {
        title: "Verify full specifications",
        body: "Title-derived specs cover the headline config. For ports, battery, and panel details, check the specification table and seller notes.",
      },
    ],
    specificationGroups: [
      {
        name: "General",
        rows: [
          { key: "Brand", value: brand },
          { key: "Model", value: p.title },
          { key: "Type", value: "Laptop" },
        ],
      },
      {
        name: "Processor And Memory Features",
        rows: [
          { key: "Processor", value: cpu },
          ...(ram ? [{ key: "RAM", value: ram }] : []),
        ],
      },
    ],
    warranty: {
      summary: "1 Year brand warranty (typical for notebooks)",
      covered: "Manufacturing defects",
      notCovered: "Physical damage, liquid spill, burn",
      serviceType: "Brand carry-in / onsite as applicable",
    },
  });
}

export function enrichProduct(product: EnrichableProduct): ProductEnrichment {
  const override = LAPTOP_ENRICHMENT_OVERRIDES[product.slug];
  if (override) return override;

  switch (product.categorySlug) {
    case "laptops":
      return deriveGenericLaptop(product);
    case "processors":
      return deriveProcessors(product);
    case "motherboards":
      return deriveMotherboard(product);
    case "graphics-cards":
      return deriveGpu(product);
    case "memory-ram":
      return deriveRam(product);
    case "storage-ssd":
      return deriveStorage(product);
    case "cabinets":
      return deriveCabinet(product);
    case "power-supplies":
      return derivePsu(product);
    case "cpu-coolers":
      return deriveCooler(product);
    case "keyboard-mouse":
      return derivePeripherals(product);
    case "monitors":
      return deriveMonitor(product);
    case "ups":
      return deriveUps(product);
    default:
      return deriveProcessors(product);
  }
}

export function toEnrichmentAttributes(
  product: EnrichableProduct,
  enrichment: ProductEnrichment,
): EnrichmentAttributes {
  return {
    brand: brandDisplay(product.brandSlug, product.brandName),
    city: "Pune",
    source: enrichment.source,
    highlights: enrichment.highlightMap,
    highlightRows: enrichment.highlights,
    specificationGroups: enrichment.specificationGroups,
    descriptionBlocks: enrichment.descriptionBlocks,
    warranty: enrichment.warranty,
    cardBullets: enrichment.cardBullets,
  };
}
