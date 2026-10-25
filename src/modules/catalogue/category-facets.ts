/**
 * Category-specific browse filters for the PC catalogue.
 * Facet values are derived from product titles (+ laptop overrides) and
 * stored on Product.attributes.facets for queryable JSON filtering.
 */
import { PC_PRODUCTS } from "@/modules/catalogue/pc-catalogue-data";
import { LAPTOP_ENRICHMENT_OVERRIDES } from "@/modules/catalogue/laptop-enrichment-overrides";

export type FacetDef = {
  /** Stable key stored under attributes.facets[key] */
  key: string;
  /** Sidebar label */
  label: string;
  /** Optional sort for numeric-ish values */
  sort?: "alpha" | "numeric";
};

export type CategoryFacetConfig = {
  categorySlug: string;
  facets: FacetDef[];
};

function match(title: string, re: RegExp): string | null {
  const m = title.match(re);
  return m?.[1]?.trim() ?? null;
}

function normalizeForm(raw: string): string {
  const t = raw.toUpperCase().replace(/\s+/g, " ").trim();
  if (/^MICRO-?ATX$|^M-?ATX$/.test(t)) return "mATX";
  if (/^MINI-?ITX$|^ITX$/.test(t)) return "Mini-ITX";
  if (/^E-?ATX$/.test(t)) return "E-ATX";
  if (/^ATX$/.test(t)) return "ATX";
  if (/FULL\s*TOWER/.test(t)) return "Full Tower";
  if (/MID\s*TOWER/.test(t)) return "Mid Tower";
  if (/MINI\s*TOWER/.test(t)) return "Mini Tower";
  return raw;
}

function processorFacets(title: string): Record<string, string> {
  const facets: Record<string, string> = {};
  if (/Ryzen/i.test(title)) facets.brandFamily = "AMD Ryzen";
  else if (/Core\s+Ultra|Ultra\s+\d/i.test(title)) facets.brandFamily = "Intel Core Ultra";
  else if (/Core\s+i[3579]|i[3579]-/i.test(title)) facets.brandFamily = "Intel Core";

  if (/Ryzen\s*9/i.test(title)) facets.tier = "Ryzen 9";
  else if (/Ryzen\s*7/i.test(title)) facets.tier = "Ryzen 7";
  else if (/Ryzen\s*5/i.test(title)) facets.tier = "Ryzen 5";
  else if (/Ryzen\s*3/i.test(title)) facets.tier = "Ryzen 3";
  else if (/i9|Ultra\s*9/i.test(title)) facets.tier = "Core i9 / Ultra 9";
  else if (/i7|Ultra\s*7/i.test(title)) facets.tier = "Core i7 / Ultra 7";
  else if (/i5|Ultra\s*5|Core\s+5/i.test(title)) facets.tier = "Core i5 / Ultra 5";
  else if (/i3|Ultra\s*3|Core\s+3/i.test(title)) facets.tier = "Core i3 / Ultra 3";

  // Socket heuristics from common desktop SKUs in catalogue
  // AM5: Ryzen 7000 / 8000 / 9000 (and G-series APUs); AM4: 5000 and older
  if (
    /Ryzen\s*(3|5|7|9)\s*[789]\d{3}/i.test(title) ||
    /8[4567]00G|8700G|8600G|8500G|8400F/i.test(title)
  ) {
    facets.socket = "AM5";
  } else if (/Ryzen/i.test(title)) {
    facets.socket = "AM4";
  } else if (/Ultra|225|245|265|285/i.test(title)) {
    facets.socket = "LGA 1851";
  } else if (/i[3579]-1[234]|12\d{3}|13\d{3}|14\d{3}/i.test(title)) {
    facets.socket = "LGA 1700";
  }

  if (/\b\d{4,5}F\b|F Processor/i.test(title)) facets.integratedGraphics = "No (needs GPU)";
  else if (/Vega|Radeon Graphics|with Radeon|Graphics\)/i.test(title)) {
    facets.integratedGraphics = "Yes";
  }

  return facets;
}

function motherboardFacets(title: string): Record<string, string> {
  const facets: Record<string, string> = {};
  const mem = match(title, /\b(DDR[45])\b/i);
  if (mem) facets.memoryType = mem.toUpperCase();
  const form = match(title, /\b(E-?ATX|Micro-?ATX|M-?ATX|Mini-?ITX|ITX|ATX)\b/i);
  if (form) facets.formFactor = normalizeForm(form);
  const chipset = match(title, /\b([ABZHX]\d{3}[A-Z]?)\b/i);
  if (chipset) facets.chipset = chipset.toUpperCase();
  if (/B650|X670|A620|B840|X870/i.test(title)) facets.cpuPlatform = "AMD AM5";
  else if (/B550|A520|X570|B450|A320/i.test(title)) facets.cpuPlatform = "AMD AM4";
  else if (/Z890|B860|H810/i.test(title)) facets.cpuPlatform = "Intel LGA 1851";
  else if (/Z790|B760|H610|B660|Z690|H670/i.test(title)) facets.cpuPlatform = "Intel LGA 1700";
  return facets;
}

function normalizeGpuSeries(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/^(GTX|RTX|RX|GT)(\d)/, "$1 $2")
    .replace(/\bTI\b/, "Ti")
    .trim();
}

function gpuFacets(title: string): Record<string, string> {
  const facets: Record<string, string> = {};
  if (/Quadro|RTX\s*A\d{3,4}/i.test(title)) {
    facets.generation = "Professional";
    const pro = match(title, /\b(RTX\s*A\d{3,4})\b/i);
    facets.series = pro ? normalizeGpuSeries(pro) : "Quadro";
  } else {
    const series = match(
      title,
      /\b(RTX\s?\d{3,4}(?:\s*Ti)?|GTX\s?\d{3,4}|RX\s?\d{3,4}|GT\s?\d{3,4})\b/i,
    );
    if (series) {
      const norm = normalizeGpuSeries(series);
      facets.series = norm;
      if (/RTX\s?50/i.test(norm)) facets.generation = "RTX 50-series";
      else if (/RTX\s?40/i.test(norm)) facets.generation = "RTX 40-series";
      else if (/RTX\s?30/i.test(norm)) facets.generation = "RTX 30-series";
      else if (/RTX\s?20/i.test(norm)) facets.generation = "RTX 20-series";
      else if (/GTX/i.test(norm)) facets.generation = "GTX";
      else if (/RX\s?7/i.test(norm)) facets.generation = "Radeon RX 7000";
      else if (/RX/i.test(norm)) facets.generation = "Radeon RX";
      else if (/GT\s?\d/i.test(norm)) facets.generation = "GT entry";
    }
  }
  // Titles use both "12GB" and shorthand "12G GDDR7"
  const vram = match(title, /(\d+)\s*G(?:B)?(?=\s|$|DR)/i);
  if (vram) facets.vram = `${vram} GB`;
  const mem = match(title, /\b(GDDR7|GDDR6X|GDDR6|GDDR5|DDR5|DDR4)\b/i);
  if (mem) facets.memoryType = mem.toUpperCase();
  return facets;
}

function ramFacets(title: string): Record<string, string> {
  const facets: Record<string, string> = {};
  const type = match(title, /\b(DDR5|DDR4|LPDDR5|LPDDR4X)\b/i);
  if (type) facets.memoryType = type.toUpperCase();
  const size = match(title, /(\d+)\s*GB/i);
  if (size) facets.capacity = `${size} GB`;
  const speed = match(title, /(\d{3,5})\s*MHz/i);
  if (speed) facets.speed = `${speed} MHz`;
  facets.formFactor = /laptop/i.test(title) ? "Laptop (SO-DIMM)" : "Desktop (DIMM)";
  return facets;
}

function storageCapacityBand(amount: number, unit: string): string {
  const gb = unit === "TB" ? amount * 1000 : amount;
  if (gb < 500) return "Under 500 GB";
  if (gb <= 1000) return "500 GB – 1 TB";
  if (gb <= 2000) return "1–2 TB";
  return "Above 2 TB";
}

function storageFacets(title: string): Record<string, string> {
  const facets: Record<string, string> = {};
  const capMatch = title.match(/(\d+(?:\.\d+)?)\s*(TB|GB)/i);
  const capAmount = capMatch?.[1];
  const capUnit = capMatch?.[2];
  if (capAmount && capUnit) {
    const amount = Number(capAmount);
    const unit = capUnit.toUpperCase();
    facets.capacity =
      Number.isInteger(amount) || amount % 1 === 0
        ? `${Math.round(amount)} ${unit}`
        : `${amount} ${unit}`;
    facets.capacityBand = storageCapacityBand(amount, unit);
  }
  if (/NAS/i.test(title)) facets.interface = "NAS / enclosure";
  else if (/NVMe|PCIe/i.test(title)) facets.interface = "NVMe / PCIe";
  else if (/SATA/i.test(title)) facets.interface = "SATA";
  else if (/USB|Pen Drive/i.test(title)) facets.interface = "USB flash";
  else if (/MicroSD|SDXC|Memory Card/i.test(title)) facets.interface = "Memory card";
  else if (/HDD|Hard Disk|Hard Drive|Barracuda|My Book|One Touch/i.test(title)) {
    facets.interface = "HDD";
  } else if (/SSD/i.test(title)) facets.interface = "SSD";
  return facets;
}

function cabinetFacets(title: string): Record<string, string> {
  const facets: Record<string, string> = {};
  const tower = match(title, /\b(Full\s*Tower|Mid\s*Tower|Mini\s*Tower)\b/i);
  if (tower) facets.towerSize = normalizeForm(tower);
  const mb = match(title, /\b(E-?ATX|Micro-?ATX|M-?ATX|Mini-?ITX|ITX|ATX)\b/i);
  if (mb) facets.motherboardSupport = normalizeForm(mb);
  facets.lighting = /\b(ARGB|RGB)\b/i.test(title) ? "ARGB / RGB" : "Non-RGB";
  if (/White|Ivory/i.test(title)) facets.color = "White";
  else facets.color = "Black";
  return facets;
}

function psuFacets(title: string): Record<string, string> {
  const facets: Record<string, string> = {};
  let watts = match(title, /(\d{3,4})\s*(?:W|Watt)/i);
  if (!watts) {
    // Model codes without an explicit "W": VS400L, V550, E1-500, RX750, PN750D…
    watts = match(
      title,
      /(?:VS|RX|PN|CSK|RM|SF|Atom\s*V|E1-|C)(\d{3,4})/i,
    );
  }
  if (watts) {
    const w = Number(watts);
    facets.wattage = `${watts} W`;
    if (w < 500) facets.wattageBand = "Under 500 W";
    else if (w < 650) facets.wattageBand = "500–649 W";
    else if (w < 850) facets.wattageBand = "650–849 W";
    else facets.wattageBand = "850 W & above";
  }
  const eff = match(title, /\b(Platinum|Gold|Silver|Bronze)\b/i);
  if (eff) facets.efficiency = eff;
  return facets;
}

function coolerFacets(title: string): Record<string, string> {
  const facets: Record<string, string> = {};
  if (/\b(AIO|liquid)\b/i.test(title)) facets.type = "AIO liquid";
  else facets.type = "Air cooler";
  const size = match(title, /\b(360|280|240|120)\s*mm\b/i);
  if (size) facets.size = `${size} mm`;
  facets.lighting = /\b(ARGB|RGB|Rainbow|LED)\b/i.test(title)
    ? "RGB / LED"
    : "Non-RGB";
  return facets;
}

function peripheralFacets(title: string): Record<string, string> {
  const facets: Record<string, string> = {};
  if (/keyboard/i.test(title) && /mouse/i.test(title)) facets.type = "Combo";
  else if (/keyboard/i.test(title)) facets.type = "Keyboard";
  else if (/mouse/i.test(title)) facets.type = "Mouse";
  else facets.type = "Accessory";
  facets.connectivity = /wireless|bluetooth|2\.4/i.test(title)
    ? "Wireless"
    : "Wired";
  if (/gaming/i.test(title)) facets.useCase = "Gaming";
  else if (/wireless|bluetooth/i.test(title)) facets.useCase = "Productivity";
  return facets;
}

function monitorFacets(title: string): Record<string, string> {
  const facets: Record<string, string> = {};
  const size = match(title, /(\d{2}(?:\.\d+)?)\s*(?:Inch|inch)/i);
  if (size) {
    facets.screenSize = `${size}"`;
    const n = Number(size);
    if (n <= 24) facets.sizeBand = `24" & under`;
    else if (n <= 27) facets.sizeBand = `25–27"`;
    else if (n <= 32) facets.sizeBand = `28–32"`;
    else facets.sizeBand = `34" & ultrawide`;
  }
  const res = match(title, /\b(4K|UHD|QHD|WQHD|FHD|Full\s*HD)\b/i);
  if (res) {
    const r = res.toUpperCase().replace(/\s+/g, " ");
    facets.resolution = r === "FULL HD" ? "FHD" : r === "UHD" ? "4K" : r;
  }
  if (/OLED|QD-OLED/i.test(title)) facets.panelType = "OLED";
  else if (/Curved/i.test(title)) facets.panelType = "Curved LCD";
  else facets.panelType = "Flat LCD";
  if (/gaming|ultragear|odyssey|legion|alienware|agon|rog/i.test(title)) {
    facets.useCase = "Gaming";
  } else if (/smart/i.test(title)) {
    facets.useCase = "Smart / entertainment";
  } else {
    facets.useCase = "Office / general";
  }
  return facets;
}

function upsFacets(title: string): Record<string, string> {
  const facets: Record<string, string> = {};
  const va = match(title, /(\d{3,4})\s*VA/i);
  if (va) {
    facets.capacity = `${va} VA`;
    const n = Number(va);
    if (n < 800) facets.capacityBand = "Under 800 VA";
    else if (n < 1500) facets.capacityBand = "800–1499 VA";
    else facets.capacityBand = "1500 VA & above";
  }
  if (/online|OLS/i.test(title)) facets.topology = "Online";
  else facets.topology = "Line-interactive";
  return facets;
}

function normalizeLaptopProcessor(raw: string): string {
  if (/Ryzen\s*9/i.test(raw)) return "AMD Ryzen 9";
  if (/Ryzen\s*7/i.test(raw)) return "AMD Ryzen 7";
  if (/Ryzen\s*5/i.test(raw)) return "AMD Ryzen 5";
  if (/Ryzen\s*3|Ryzen/i.test(raw)) return "AMD Ryzen 3";
  if (/Ultra\s*9|i9/i.test(raw)) return "Intel Core Ultra / i9";
  if (/Ultra\s*7|i7/i.test(raw)) return "Intel Core Ultra / i7";
  if (/Core\s*5|Ultra\s*5|i5/i.test(raw)) return "Intel Core 5 / i5";
  if (/Core\s*3|Ultra\s*3|i3/i.test(raw)) return "Intel Core 3 / i3";
  if (/Intel/i.test(raw)) return "Intel Core";
  return raw.slice(0, 40);
}

function normalizeLaptopRam(raw: string): string {
  const gb = raw.match(/(\d+)\s*GB/i)?.[1];
  return gb ? `${gb} GB` : raw.replace(/of.*/i, "").trim().slice(0, 20);
}

function normalizeLaptopStorage(raw: string): string {
  const m = raw.match(/(\d+(?:\.\d+)?)\s*(TB|GB)/i);
  const amount = m?.[1];
  const unit = m?.[2];
  if (!amount || !unit) return raw.slice(0, 40);
  return `${amount} ${unit.toUpperCase()}`;
}

function normalizeLaptopMemoryType(raw: string): string {
  const m = raw.match(/\b(LPDDR5X|LPDDR5|LPDDR4X|DDR5|DDR4)\b/i)?.[1];
  return m
    ? m.toUpperCase()
    : raw.replace(/\(.*?\)/g, "").trim().slice(0, 20);
}

function laptopFacets(title: string, slug?: string): Record<string, string> {
  const facets: Record<string, string> = {};
  // Prefer curated override specs when available
  if (slug && LAPTOP_ENRICHMENT_OVERRIDES[slug]) {
    const groups = LAPTOP_ENRICHMENT_OVERRIDES[slug].specificationGroups;
    const flat = new Map<string, string>();
    for (const g of groups) {
      for (const row of g.rows) flat.set(row.key.toLowerCase(), row.value);
    }
    const cpu =
      flat.get("processor model") ??
      flat.get("processor name") ??
      flat.get("processor");
    if (cpu) facets.processor = normalizeLaptopProcessor(cpu);
    const ram = flat.get("ram") ?? flat.get("memory size");
    if (ram) facets.ram = normalizeLaptopRam(ram);
    const ramType = flat.get("ram type") ?? flat.get("memory type");
    if (ramType) facets.memoryType = normalizeLaptopMemoryType(ramType);
    const ssd = flat.get("ssd capacity") ?? flat.get("ssd");
    if (ssd) facets.storage = normalizeLaptopStorage(ssd);
    const gpu = flat.get("graphic processor") ?? flat.get("graphics card");
    if (gpu) {
      facets.graphics = /RTX|GTX|RX\s?\d/i.test(gpu)
        ? "Discrete GPU"
        : "Integrated";
    }
    const os = flat.get("operating system");
    if (os) {
      facets.os = /Windows/i.test(os)
        ? "Windows"
        : /Linux/i.test(os)
          ? "Linux"
          : os;
    }
    const size = flat.get("screen size");
    if (size) {
      const inches = size.match(/(\d+(?:\.\d+)?)\s*Inch/i)?.[1];
      if (inches) facets.screenSize = `${inches}"`;
    }
    return facets;
  }

  if (/Ryzen/i.test(title)) facets.processor = normalizeLaptopProcessor(title);
  else if (/Core\s+[35]|Core\s+Ultra|i[357]-/i.test(title)) {
    facets.processor = normalizeLaptopProcessor(title);
  }
  const ram = match(title, /(\d+)\s*GB(?:-|\s)?(?:DDR|LPDDR|RAM)?/i);
  if (ram) facets.ram = `${ram} GB`;
  facets.graphics = /RTX|GTX/i.test(title) ? "Discrete GPU" : "Integrated";
  facets.os = /Linux/i.test(title) ? "Linux" : "Windows";
  return facets;
}

export const CATEGORY_FACET_CONFIGS: CategoryFacetConfig[] = [
  {
    categorySlug: "processors",
    facets: [
      { key: "brandFamily", label: "Brand family" },
      { key: "tier", label: "Series / tier" },
      { key: "socket", label: "Socket" },
      { key: "integratedGraphics", label: "Integrated graphics" },
    ],
  },
  {
    categorySlug: "motherboards",
    facets: [
      { key: "cpuPlatform", label: "CPU platform" },
      { key: "memoryType", label: "Memory type" },
      { key: "formFactor", label: "Form factor" },
      { key: "chipset", label: "Chipset" },
    ],
  },
  {
    categorySlug: "graphics-cards",
    facets: [
      { key: "generation", label: "Generation" },
      { key: "series", label: "GPU model" },
      { key: "vram", label: "VRAM", sort: "numeric" },
      { key: "memoryType", label: "Memory type" },
    ],
  },
  {
    categorySlug: "memory-ram",
    facets: [
      { key: "memoryType", label: "Memory type" },
      { key: "capacity", label: "Capacity", sort: "numeric" },
      { key: "speed", label: "Speed", sort: "numeric" },
      { key: "formFactor", label: "Form factor" },
    ],
  },
  {
    categorySlug: "storage-ssd",
    facets: [
      { key: "interface", label: "Type / interface" },
      { key: "capacityBand", label: "Capacity" },
      { key: "capacity", label: "Exact capacity", sort: "numeric" },
    ],
  },
  {
    categorySlug: "cabinets",
    facets: [
      { key: "towerSize", label: "Case size" },
      { key: "motherboardSupport", label: "Motherboard support" },
      { key: "lighting", label: "Lighting" },
      { key: "color", label: "Color" },
    ],
  },
  {
    categorySlug: "power-supplies",
    facets: [
      { key: "wattageBand", label: "Wattage" },
      { key: "efficiency", label: "Efficiency" },
      { key: "wattage", label: "Exact wattage", sort: "numeric" },
    ],
  },
  {
    categorySlug: "cpu-coolers",
    facets: [
      { key: "type", label: "Cooler type" },
      { key: "size", label: "Size", sort: "numeric" },
      { key: "lighting", label: "Lighting" },
    ],
  },
  {
    categorySlug: "keyboard-mouse",
    facets: [
      { key: "type", label: "Type" },
      { key: "connectivity", label: "Connectivity" },
      { key: "useCase", label: "Use case" },
    ],
  },
  {
    categorySlug: "monitors",
    facets: [
      { key: "sizeBand", label: "Screen size" },
      { key: "resolution", label: "Resolution" },
      { key: "panelType", label: "Panel type" },
      { key: "useCase", label: "Use case" },
    ],
  },
  {
    categorySlug: "ups",
    facets: [
      { key: "capacityBand", label: "Capacity" },
      { key: "topology", label: "Topology" },
      { key: "capacity", label: "Exact VA", sort: "numeric" },
    ],
  },
  {
    categorySlug: "laptops",
    facets: [
      { key: "processor", label: "Processor" },
      { key: "ram", label: "RAM" },
      { key: "memoryType", label: "Memory type" },
      { key: "graphics", label: "Graphics" },
      { key: "storage", label: "Storage" },
      { key: "screenSize", label: "Screen size" },
      { key: "os", label: "Operating system" },
    ],
  },
];

const CONFIG_BY_SLUG = new Map(
  CATEGORY_FACET_CONFIGS.map((c) => [c.categorySlug, c]),
);

export function getCategoryFacetConfig(
  categorySlug: string | null | undefined,
): CategoryFacetConfig | null {
  if (!categorySlug) return null;
  return CONFIG_BY_SLUG.get(categorySlug) ?? null;
}

export function extractProductFacets(input: {
  slug: string;
  title: string;
  categorySlug: string;
}): Record<string, string> {
  switch (input.categorySlug) {
    case "processors":
      return processorFacets(input.title);
    case "motherboards":
      return motherboardFacets(input.title);
    case "graphics-cards":
      return gpuFacets(input.title);
    case "memory-ram":
      return ramFacets(input.title);
    case "storage-ssd":
      return storageFacets(input.title);
    case "cabinets":
      return cabinetFacets(input.title);
    case "power-supplies":
      return psuFacets(input.title);
    case "cpu-coolers":
      return coolerFacets(input.title);
    case "keyboard-mouse":
      return peripheralFacets(input.title);
    case "monitors":
      return monitorFacets(input.title);
    case "ups":
      return upsFacets(input.title);
    case "laptops":
      return laptopFacets(input.title, input.slug);
    default:
      return {};
  }
}

function numericSortKey(value: string): number {
  const m = value.match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
}

/** Precomputed facet options that actually exist in the seeded catalogue. */
export function buildFacetOptionsForCatalogue(): Record<
  string,
  Record<string, string[]>
> {
  const byCat = new Map<string, Map<string, Map<string, number>>>();
  for (const product of PC_PRODUCTS) {
    const facets = extractProductFacets(product);
    let catMap = byCat.get(product.categorySlug);
    if (!catMap) {
      catMap = new Map();
      byCat.set(product.categorySlug, catMap);
    }
    for (const [key, value] of Object.entries(facets)) {
      if (!value) continue;
      let map = catMap.get(key);
      if (!map) {
        map = new Map();
        catMap.set(key, map);
      }
      map.set(value, (map.get(value) ?? 0) + 1);
    }
  }

  const result: Record<string, Record<string, string[]>> = {};
  for (const config of CATEGORY_FACET_CONFIGS) {
    const catOptions: Record<string, string[]> = {};
    const catMap = byCat.get(config.categorySlug);
    for (const facet of config.facets) {
      const counts = catMap?.get(facet.key);
      if (!counts) {
        catOptions[facet.key] = [];
        continue;
      }
      const values = [...counts.keys()];
      if (facet.sort === "numeric") {
        values.sort((a, b) => numericSortKey(a) - numericSortKey(b));
      } else {
        values.sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
      }
      catOptions[facet.key] = values;
    }
    result[config.categorySlug] = catOptions;
  }
  return result;
}

export const CATALOGUE_FACET_OPTIONS = buildFacetOptionsForCatalogue();

/** Selected facet values — multi-select per key (OR within key, AND across keys). */
export type FacetSelection = Record<string, string[]>;

function pushFacetValue(
  facets: FacetSelection,
  facetKey: string,
  raw: string,
) {
  const key = facetKey.trim();
  if (!key) return;
  for (const part of raw.split(",")) {
    const value = part.trim().slice(0, 80);
    if (!value) continue;
    const existing = facets[key] ?? [];
    if (!existing.includes(value)) {
      facets[key] = [...existing, value];
    }
  }
}

/**
 * Parse `facet.*` query params into multi-value selections.
 * Accepts repeated keys (`facet.socket=AM5&facet.socket=AM4`) and
 * comma-separated values (`facet.socket=AM5,AM4`).
 */
export function parseFacetSearchParams(
  searchParams:
    | URLSearchParams
    | Record<string, string | string[] | undefined>,
): FacetSelection {
  const facets: FacetSelection = {};
  if (searchParams instanceof URLSearchParams) {
    for (const [key, value] of searchParams.entries()) {
      if (!key.startsWith("facet.")) continue;
      pushFacetValue(facets, key.slice("facet.".length), value);
    }
  } else {
    for (const [key, value] of Object.entries(searchParams)) {
      if (!key.startsWith("facet.") || value == null) continue;
      const facetKey = key.slice("facet.".length);
      if (Array.isArray(value)) {
        for (const entry of value) pushFacetValue(facets, facetKey, entry);
      } else {
        pushFacetValue(facets, facetKey, value);
      }
    }
  }
  // Stable sort values within each key for predictable URLs/chips
  for (const key of Object.keys(facets)) {
    facets[key] = [...(facets[key] ?? [])].sort((a, b) =>
      a.localeCompare(b, "en", { numeric: true }),
    );
  }
  return facets;
}

/** Flatten multi-select facets into repeated `facet.key=value` URL entries. */
export function facetQueryEntries(
  facets: FacetSelection,
): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  for (const key of Object.keys(facets).sort((a, b) => a.localeCompare(b))) {
    const values = facets[key] ?? [];
    for (const value of [...values].sort((a, b) =>
      a.localeCompare(b, "en", { numeric: true }),
    )) {
      if (!value) continue;
      entries.push([`facet.${key}`, value]);
    }
  }
  return entries;
}

export function toggleFacetValue(
  selected: FacetSelection,
  facetKey: string,
  value: string,
): FacetSelection {
  const current = selected[facetKey] ?? [];
  const nextValues = current.includes(value)
    ? current.filter((entry) => entry !== value)
    : [...current, value];
  const next = { ...selected };
  if (nextValues.length === 0) delete next[facetKey];
  else next[facetKey] = nextValues;
  return next;
}
