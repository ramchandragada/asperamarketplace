export type MegaMenuColumn = {
  heading: string;
  links: Array<{ label: string; href: string }>;
};

/** Brand tiles shown in the mega-menu’s right panel for the hovered category. */
export type MegaMenuBrand = {
  label: string;
  href: string;
  /** Optional photo tile; when omitted a lettermark tile is rendered. */
  imageUrl?: string;
};

export type MegaMenuCategory = {
  key: string;
  label: string;
  href: string;
  columns: MegaMenuColumn[];
  brands: MegaMenuBrand[];
};

function browse(
  categorySlug: string,
  opts?: {
    q?: string;
    brandSlug?: string;
    facets?: Record<string, string | string[]>;
  },
) {
  const params = new URLSearchParams({ categorySlug });
  if (opts?.q) params.set("q", opts.q);
  if (opts?.brandSlug) params.set("brandSlug", opts.brandSlug);
  if (opts?.facets) {
    for (const [key, value] of Object.entries(opts.facets)) {
      const values = Array.isArray(value) ? value : [value];
      for (const entry of values) {
        params.append(`facet.${key}`, entry);
      }
    }
  }
  return `/browse?${params.toString()}`;
}

function link(
  label: string,
  categorySlug: string,
  opts?: { q?: string; facets?: Record<string, string | string[]> },
) {
  return { label, href: browse(categorySlug, opts) };
}

/**
 * Official brand SVG marks in /public/brand-logos.
 * Only list slugs that have a real vector mark (Simple Icons / brand SVG).
 * Never invent text-as-logo placeholders — missing → monogram fallback in UI.
 */
const OFFICIAL_BRAND_LOGOS = new Set([
  "acer",
  "amd",
  "asus",
  "cooler-master",
  "corsair",
  "deepcool",
  "dell",
  "hyperx",
  "intel",
  "kingston",
  "lg",
  "logitech",
  "msi",
  "nvidia",
  "razer",
  "redragon",
  "samsung",
  "sandisk",
  "seagate",
  "wd",
]);

function brandLogo(brandSlug: string): string | undefined {
  if (!OFFICIAL_BRAND_LOGOS.has(brandSlug)) return undefined;
  return `/brand-logos/${brandSlug}.svg`;
}

function brand(
  label: string,
  categorySlug: string,
  brandSlug: string,
  imageUrl?: string,
): MegaMenuBrand {
  const resolved = imageUrl ?? brandLogo(brandSlug);
  return {
    label,
    href: browse(categorySlug, { brandSlug }),
    ...(resolved ? { imageUrl: resolved } : {}),
  };
}

const IMG = {
  amd: brandLogo("amd")!,
  intel: brandLogo("intel")!,
  nvidia: brandLogo("nvidia")!,
  asus: brandLogo("asus")!,
  corsair: brandLogo("corsair")!,
  samsung: brandLogo("samsung")!,
  logitech: brandLogo("logitech")!,
  msi: brandLogo("msi")!,
} as const;

export const SEARCH_PLACEHOLDER =
  "Search parts for Express delivery…";

export const TRENDING_SEARCHES = [
  "RTX 4060",
  "Ryzen 5",
  "DDR5 RAM",
  "NVMe SSD",
  "Express cooler",
  "gaming cabinet",
] as const;

/**
 * Aspera PC-components category navigation. Links filter the catalogue by
 * category slug + precise facet filters (socket, VRAM, wattage, etc.).
 */
export const MEGA_MENU: MegaMenuCategory[] = [
  {
    key: "processors",
    label: "Processors",
    href: browse("processors"),
    columns: [
      {
        heading: "By brand",
        links: [
          link("AMD Ryzen", "processors", {
            facets: { brandFamily: "AMD Ryzen" },
          }),
          link("Intel Core", "processors", {
            facets: { brandFamily: "Intel Core" },
          }),
          link("Intel Core Ultra", "processors", {
            facets: { brandFamily: "Intel Core Ultra" },
          }),
          link("All processors", "processors"),
        ],
      },
      {
        heading: "By socket",
        links: [
          link("AM5 (Ryzen 7000+)", "processors", {
            facets: { socket: "AM5" },
          }),
          link("AM4", "processors", { facets: { socket: "AM4" } }),
          link("LGA 1700", "processors", { facets: { socket: "LGA 1700" } }),
          link("LGA 1851", "processors", { facets: { socket: "LGA 1851" } }),
        ],
      },
      {
        heading: "By tier",
        links: [
          link("Ryzen 5", "processors", { facets: { tier: "Ryzen 5" } }),
          link("Ryzen 7 / 9", "processors", { facets: { tier: "Ryzen 7" } }),
          link("Core i5 / Ultra 5", "processors", {
            facets: { tier: "Core i5 / Ultra 5" },
          }),
          link("Needs discrete GPU", "processors", {
            facets: { integratedGraphics: "No (needs GPU)" },
          }),
        ],
      },
    ],
    brands: [
      brand("AMD", "processors", "amd", IMG.amd),
      brand("Intel", "processors", "intel", IMG.intel),
    ],
  },
  {
    key: "motherboards",
    label: "Motherboards",
    href: browse("motherboards"),
    columns: [
      {
        heading: "CPU platform",
        links: [
          link("AMD AM5", "motherboards", {
            facets: { cpuPlatform: "AMD AM5" },
          }),
          link("AMD AM4", "motherboards", {
            facets: { cpuPlatform: "AMD AM4" },
          }),
          link("Intel LGA 1700", "motherboards", {
            facets: { cpuPlatform: "Intel LGA 1700" },
          }),
          link("Intel LGA 1851", "motherboards", {
            facets: { cpuPlatform: "Intel LGA 1851" },
          }),
        ],
      },
      {
        heading: "Memory & form",
        links: [
          link("DDR5 boards", "motherboards", {
            facets: { memoryType: "DDR5" },
          }),
          link("DDR4 boards", "motherboards", {
            facets: { memoryType: "DDR4" },
          }),
          link("ATX", "motherboards", { facets: { formFactor: "ATX" } }),
          link("mATX", "motherboards", { facets: { formFactor: "mATX" } }),
          link("All motherboards", "motherboards"),
        ],
      },
    ],
    brands: [
      brand("ASUS", "motherboards", "asus", IMG.asus),
      brand("MSI", "motherboards", "msi"),
      brand("Gigabyte", "motherboards", "gigabyte"),
    ],
  },
  {
    key: "graphics-cards",
    label: "Graphics Cards",
    href: browse("graphics-cards"),
    columns: [
      {
        heading: "Generation",
        links: [
          link("RTX 50-series", "graphics-cards", {
            facets: { generation: "RTX 50-series" },
          }),
          link("RTX 40-series", "graphics-cards", {
            facets: { generation: "RTX 40-series" },
          }),
          link("RTX 30-series", "graphics-cards", {
            facets: { generation: "RTX 30-series" },
          }),
          link("Radeon RX 7000", "graphics-cards", {
            facets: { generation: "Radeon RX 7000" },
          }),
        ],
      },
      {
        heading: "By VRAM",
        links: [
          link("8 GB", "graphics-cards", { facets: { vram: "8 GB" } }),
          link("12 GB", "graphics-cards", { facets: { vram: "12 GB" } }),
          link("16 GB+", "graphics-cards", { facets: { vram: "16 GB" } }),
          link("All graphics cards", "graphics-cards"),
        ],
      },
    ],
    brands: [
      brand("NVIDIA", "graphics-cards", "nvidia", IMG.nvidia),
      brand("ASUS", "graphics-cards", "asus", IMG.asus),
      brand("MSI", "graphics-cards", "msi"),
      brand("Gigabyte", "graphics-cards", "gigabyte"),
      brand("Zotac", "graphics-cards", "zotac"),
      brand("AMD", "graphics-cards", "amd", IMG.amd),
    ],
  },
  {
    key: "memory-ram",
    label: "Memory",
    href: browse("memory-ram"),
    columns: [
      {
        heading: "By type",
        links: [
          link("DDR5", "memory-ram", { facets: { memoryType: "DDR5" } }),
          link("DDR4", "memory-ram", { facets: { memoryType: "DDR4" } }),
          link("Desktop DIMM", "memory-ram", {
            facets: { formFactor: "Desktop (DIMM)" },
          }),
          link("Laptop SO-DIMM", "memory-ram", {
            facets: { formFactor: "Laptop (SO-DIMM)" },
          }),
        ],
      },
      {
        heading: "By capacity",
        links: [
          link("16 GB", "memory-ram", { facets: { capacity: "16 GB" } }),
          link("32 GB", "memory-ram", { facets: { capacity: "32 GB" } }),
          link("64 GB", "memory-ram", { facets: { capacity: "64 GB" } }),
          link("All memory", "memory-ram"),
        ],
      },
    ],
    brands: [
      brand("Corsair", "memory-ram", "corsair", IMG.corsair),
      brand("ADATA", "memory-ram", "adata"),
      brand("Kingston", "memory-ram", "kingston"),
      brand("G.Skill", "memory-ram", "g-skill"),
      brand("Crucial", "memory-ram", "crucial"),
    ],
  },
  {
    key: "storage-ssd",
    label: "SSD / Storage",
    href: browse("storage-ssd"),
    columns: [
      {
        heading: "By interface",
        links: [
          link("NVMe (M.2)", "storage-ssd", {
            facets: { interface: "NVMe / PCIe" },
          }),
          link("SATA / SSD", "storage-ssd", { facets: { interface: "SSD" } }),
          link("HDD", "storage-ssd", { facets: { interface: "HDD" } }),
          link("USB flash", "storage-ssd", {
            facets: { interface: "USB flash" },
          }),
        ],
      },
      {
        heading: "By capacity",
        links: [
          link("Under 500 GB", "storage-ssd", {
            facets: { capacityBand: "Under 500 GB" },
          }),
          link("500 GB – 1 TB", "storage-ssd", {
            facets: { capacityBand: "500 GB – 1 TB" },
          }),
          link("1–2 TB", "storage-ssd", {
            facets: { capacityBand: "1–2 TB" },
          }),
          link("All storage", "storage-ssd"),
        ],
      },
    ],
    brands: [
      brand("Samsung", "storage-ssd", "samsung", IMG.samsung),
      brand("WD", "storage-ssd", "wd"),
      brand("Kingston", "storage-ssd", "kingston"),
      brand("ADATA", "storage-ssd", "adata"),
      brand("SanDisk", "storage-ssd", "sandisk"),
      brand("Seagate", "storage-ssd", "seagate"),
    ],
  },
  {
    key: "cabinets",
    label: "Cabinets",
    href: browse("cabinets"),
    columns: [
      {
        heading: "Case size",
        links: [
          link("Mid Tower", "cabinets", {
            facets: { towerSize: "Mid Tower" },
          }),
          link("Mini Tower", "cabinets", {
            facets: { towerSize: "Mini Tower" },
          }),
          link("Full Tower", "cabinets", {
            facets: { towerSize: "Full Tower" },
          }),
        ],
      },
      {
        heading: "Style",
        links: [
          link("ARGB / RGB", "cabinets", {
            facets: { lighting: "ARGB / RGB" },
          }),
          link("White builds", "cabinets", { facets: { color: "White" } }),
          link("ATX support", "cabinets", {
            facets: { motherboardSupport: "ATX" },
          }),
          link("All cabinets", "cabinets"),
        ],
      },
    ],
    brands: [
      brand("Corsair", "cabinets", "corsair", IMG.corsair),
      brand("Cooler Master", "cabinets", "cooler-master"),
      brand("Ant Esports", "cabinets", "ant-esports"),
      brand("Antec", "cabinets", "antec"),
      brand("Lian Li", "cabinets", "lian-li"),
      brand("ASUS", "cabinets", "asus", IMG.asus),
    ],
  },
  {
    key: "power-supplies",
    label: "Power Supplies",
    href: browse("power-supplies"),
    columns: [
      {
        heading: "Wattage",
        links: [
          link("500–649 W", "power-supplies", {
            facets: { wattageBand: "500–649 W" },
          }),
          link("650–849 W", "power-supplies", {
            facets: { wattageBand: "650–849 W" },
          }),
          link("850 W & above", "power-supplies", {
            facets: { wattageBand: "850 W & above" },
          }),
        ],
      },
      {
        heading: "Efficiency",
        links: [
          link("80+ Bronze", "power-supplies", {
            facets: { efficiency: "Bronze" },
          }),
          link("80+ Gold", "power-supplies", {
            facets: { efficiency: "Gold" },
          }),
          link("80+ Platinum", "power-supplies", {
            facets: { efficiency: "Platinum" },
          }),
          link("All SMPS", "power-supplies"),
        ],
      },
    ],
    brands: [
      brand("Corsair", "power-supplies", "corsair", IMG.corsair),
      brand("Thermaltake", "power-supplies", "thermaltake"),
      brand("ASUS", "power-supplies", "asus", IMG.asus),
      brand("Cooler Master", "power-supplies", "cooler-master"),
      brand("Ant Esports", "power-supplies", "ant-esports"),
      brand("Deepcool", "power-supplies", "deepcool"),
    ],
  },
  {
    key: "cpu-coolers",
    label: "CPU Coolers",
    href: browse("cpu-coolers"),
    columns: [
      {
        heading: "Cooling type",
        links: [
          link("Air coolers", "cpu-coolers", {
            facets: { type: "Air cooler" },
          }),
          link("AIO liquid", "cpu-coolers", {
            facets: { type: "AIO liquid" },
          }),
          link("240 mm AIO", "cpu-coolers", {
            facets: { type: "AIO liquid", size: "240 mm" },
          }),
          link("360 mm AIO", "cpu-coolers", {
            facets: { type: "AIO liquid", size: "360 mm" },
          }),
          link("RGB coolers", "cpu-coolers", {
            facets: { lighting: "RGB / LED" },
          }),
          link("All coolers", "cpu-coolers"),
        ],
      },
    ],
    brands: [
      brand("Cooler Master", "cpu-coolers", "cooler-master"),
      brand("Noctua", "cpu-coolers", "noctua"),
      brand("Corsair", "cpu-coolers", "corsair", IMG.corsair),
      brand("ASUS", "cpu-coolers", "asus", IMG.asus),
      brand("Ant Esports", "cpu-coolers", "ant-esports"),
      brand("Thermaltake", "cpu-coolers", "thermaltake"),
    ],
  },
  {
    key: "keyboard-mouse",
    label: "Keyboard & Mouse",
    href: browse("keyboard-mouse"),
    columns: [
      {
        heading: "Type",
        links: [
          link("Combos", "keyboard-mouse", { facets: { type: "Combo" } }),
          link("Keyboards", "keyboard-mouse", {
            facets: { type: "Keyboard" },
          }),
          link("Mice", "keyboard-mouse", { facets: { type: "Mouse" } }),
        ],
      },
      {
        heading: "Connectivity",
        links: [
          link("Wireless", "keyboard-mouse", {
            facets: { connectivity: "Wireless" },
          }),
          link("Wired", "keyboard-mouse", {
            facets: { connectivity: "Wired" },
          }),
          link("Gaming", "keyboard-mouse", {
            facets: { useCase: "Gaming" },
          }),
          link("All combos", "keyboard-mouse"),
        ],
      },
    ],
    brands: [
      brand("Logitech", "keyboard-mouse", "logitech", IMG.logitech),
      brand("Razer", "keyboard-mouse", "razer"),
      brand("Cosmic Byte", "keyboard-mouse", "cosmic-byte"),
      brand("Redragon", "keyboard-mouse", "redragon"),
      brand("ASUS", "keyboard-mouse", "asus", IMG.asus),
      brand("HyperX", "keyboard-mouse", "hyperx"),
    ],
  },
  {
    key: "monitors",
    label: "Monitors",
    href: browse("monitors"),
    columns: [
      {
        heading: "By size",
        links: [
          link(`24" & under`, "monitors", {
            facets: { sizeBand: `24" & under` },
          }),
          link(`25–27"`, "monitors", { facets: { sizeBand: `25–27"` } }),
          link(`28–32"`, "monitors", { facets: { sizeBand: `28–32"` } }),
          link(`34" & ultrawide`, "monitors", {
            facets: { sizeBand: `34" & ultrawide` },
          }),
        ],
      },
      {
        heading: "By use",
        links: [
          link("Gaming", "monitors", { facets: { useCase: "Gaming" } }),
          link("Office", "monitors", {
            facets: { useCase: "Office / general" },
          }),
          link("4K / UHD", "monitors", { facets: { resolution: "4K" } }),
          link("OLED", "monitors", { facets: { panelType: "OLED" } }),
          link("All monitors", "monitors"),
        ],
      },
    ],
    brands: [
      brand("Samsung", "monitors", "samsung", IMG.samsung),
      brand("ASUS", "monitors", "asus", IMG.asus),
      brand("MSI", "monitors", "msi"),
      brand("LG", "monitors", "lg"),
      brand("BenQ", "monitors", "benq"),
      brand("AOC", "monitors", "aoc"),
      brand("Dell", "monitors", "dell"),
      brand("ViewSonic", "monitors", "viewsonic"),
    ],
  },
  {
    key: "ups",
    label: "UPS",
    href: browse("ups"),
    columns: [
      {
        heading: "Capacity",
        links: [
          link("Under 800 VA", "ups", {
            facets: { capacityBand: "Under 800 VA" },
          }),
          link("800–1499 VA", "ups", {
            facets: { capacityBand: "800–1499 VA" },
          }),
          link("1500 VA & above", "ups", {
            facets: { capacityBand: "1500 VA & above" },
          }),
        ],
      },
      {
        heading: "Topology",
        links: [
          link("Line-interactive", "ups", {
            facets: { topology: "Line-interactive" },
          }),
          link("Online UPS", "ups", { facets: { topology: "Online" } }),
          link("All UPS", "ups"),
        ],
      },
    ],
    brands: [
      brand("APC", "ups", "apc"),
      brand("CyberPower", "ups", "cyberpower"),
      brand("Microtek", "ups", "microtek"),
      brand("Fingers", "ups", "fingers"),
    ],
  },
  {
    key: "laptops",
    label: "Laptops",
    href: browse("laptops"),
    columns: [
      {
        heading: "Processor",
        links: [
          link("Intel Core 3 / i3", "laptops", {
            facets: { processor: "Intel Core 3 / i3" },
          }),
          link("Intel Core 5 / i5", "laptops", {
            facets: { processor: "Intel Core 5 / i5" },
          }),
          link("AMD Ryzen 3", "laptops", {
            facets: { processor: "AMD Ryzen 3" },
          }),
        ],
      },
      {
        heading: "Specs",
        links: [
          link("8 GB RAM", "laptops", { facets: { ram: "8 GB" } }),
          link("16 GB RAM", "laptops", { facets: { ram: "16 GB" } }),
          link("Discrete GPU", "laptops", {
            facets: { graphics: "Discrete GPU" },
          }),
          link("Windows", "laptops", { facets: { os: "Windows" } }),
          link("All laptops", "laptops"),
        ],
      },
    ],
    brands: [
      brand("ASUS", "laptops", "asus", IMG.asus),
      brand("Acer", "laptops", "acer"),
      brand("MSI", "laptops", "msi"),
      brand("Intel", "laptops", "intel", IMG.intel),
    ],
  },
];

/** Homepage shop-by-category tiles — real component crops on light wells. */
export const ASPERA_CATEGORY_TILES = [
  { id: "processors", label: "Processors", href: browse("processors"), imageUrl: "/category-tiles/pc-cpu.jpg", bgTint: "#ffffff" },
  { id: "graphics-cards", label: "Graphics Cards", href: browse("graphics-cards"), imageUrl: "/category-tiles/pc-gpu.jpg", bgTint: "#ffffff" },
  { id: "motherboards", label: "Motherboards", href: browse("motherboards"), imageUrl: "/category-tiles/pc-mobo.jpg", bgTint: "#ffffff" },
  { id: "memory-ram", label: "Memory", href: browse("memory-ram"), imageUrl: "/category-tiles/pc-ram.jpg", bgTint: "#ffffff" },
  { id: "storage-ssd", label: "SSD / Storage", href: browse("storage-ssd"), imageUrl: "/category-tiles/pc-ssd.jpg", bgTint: "#ffffff" },
  { id: "laptops", label: "Laptops", href: browse("laptops"), imageUrl: "/category-tiles/pc-cpu.jpg", bgTint: "#ffffff" },
  { id: "power-supplies", label: "Power Supplies", href: browse("power-supplies"), imageUrl: "/category-tiles/pc-cabinet.jpg", bgTint: "#ffffff" },
  { id: "cpu-coolers", label: "CPU Coolers", href: browse("cpu-coolers"), imageUrl: "/category-tiles/pc-cpu.jpg", bgTint: "#ffffff" },
  { id: "monitors", label: "Monitors", href: browse("monitors"), imageUrl: "/category-tiles/pc-monitor.jpg", bgTint: "#ffffff" },
  { id: "cabinets", label: "Cabinets", href: browse("cabinets"), imageUrl: "/category-tiles/pc-cabinet.jpg", bgTint: "#ffffff" },
  { id: "keyboard-mouse", label: "Keyboard & Mouse", href: browse("keyboard-mouse"), imageUrl: "/category-tiles/pc-keyboard.jpg", bgTint: "#ffffff" },
] as const;

/** Shop-by-brand lanes — logo only; deep-link to brand + category facets. */
export const ASPERA_BRAND_LANES = [
  {
    id: "intel",
    label: "Intel",
    href: browse("processors", { facets: { brandFamily: "Intel Core" } }),
    imageUrl: IMG.intel,
  },
  {
    id: "amd",
    label: "AMD",
    href: browse("processors", { facets: { brandFamily: "AMD Ryzen" } }),
    imageUrl: IMG.amd,
  },
  {
    id: "nvidia",
    label: "NVIDIA",
    href: browse("graphics-cards", {
      facets: { generation: "RTX 50-series" },
    }),
    imageUrl: IMG.nvidia,
  },
  {
    id: "asus",
    label: "ASUS",
    href: browse("motherboards", { q: "ASUS" }),
    imageUrl: IMG.asus,
  },
  {
    id: "corsair",
    label: "Corsair",
    href: browse("memory-ram", { q: "Corsair" }),
    imageUrl: IMG.corsair,
  },
  {
    id: "samsung",
    label: "Samsung",
    href: browse("storage-ssd", { q: "Samsung" }),
    imageUrl: IMG.samsung,
  },
  {
    id: "logitech",
    label: "Logitech",
    href: browse("keyboard-mouse", { q: "Logitech" }),
    imageUrl: IMG.logitech,
  },
  {
    id: "msi",
    label: "MSI",
    href: browse("motherboards", { q: "MSI" }),
    imageUrl: IMG.msi,
  },
] as const;

/** @deprecated Prefer ASPERA_CATEGORY_TILES — kept for import compatibility */
export const MEESHO_ARCH_CATEGORIES = ASPERA_CATEGORY_TILES.map((tile) => ({
  id: tile.id,
  label: tile.label,
  href: tile.href,
  imageUrl: tile.imageUrl,
  bgTint: tile.bgTint,
}));

export const ALL_CATEGORIES_MENU = {
  key: "all",
  label: "All categories",
  href: "/browse",
} as const;

export const POPULAR_NAV = {
  key: "popular",
  label: "Popular",
  href: "/popular",
} as const;
