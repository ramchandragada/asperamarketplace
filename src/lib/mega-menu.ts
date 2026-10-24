export type MegaMenuColumn = {
  heading: string;
  links: Array<{ label: string; href: string }>;
};

export type MegaMenuCategory = {
  key: string;
  label: string;
  href: string;
  columns: MegaMenuColumn[];
};

function browse(categorySlug: string, opts?: { q?: string }) {
  const params = new URLSearchParams({ categorySlug });
  if (opts?.q) params.set("q", opts.q);
  return `/browse?${params.toString()}`;
}

function link(label: string, categorySlug: string, opts?: { q?: string }) {
  return { label, href: browse(categorySlug, opts) };
}

export const SEARCH_PLACEHOLDER =
  "Search CPUs, GPUs, motherboards, SSDs…";

export const TRENDING_SEARCHES = [
  "RTX 4060",
  "Ryzen 5",
  "DDR5 RAM",
  "NVMe SSD",
  "144Hz monitor",
  "gaming cabinet",
] as const;

/**
 * Aspera PC-components category navigation. Links filter the catalogue by
 * category slug (+ a search term for sub-types), mapped to the seeded Pune
 * PC marketplace.
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
          link("Intel Core", "processors", { q: "Intel" }),
          link("AMD Ryzen", "processors", { q: "Ryzen" }),
          link("All processors", "processors"),
        ],
      },
      {
        heading: "By use",
        links: [
          link("Budget / office", "processors", { q: "i3" }),
          link("Gaming", "processors", { q: "X3D" }),
          link("Workstation", "processors", { q: "i9" }),
        ],
      },
    ],
  },
  {
    key: "motherboards",
    label: "Motherboards",
    href: browse("motherboards"),
    columns: [
      {
        heading: "Intel (LGA1700)",
        links: [
          link("H610 / B760", "motherboards", { q: "B760" }),
          link("Z790", "motherboards", { q: "Z790" }),
        ],
      },
      {
        heading: "AMD (AM4 / AM5)",
        links: [
          link("B550 / A520", "motherboards", { q: "B550" }),
          link("B650 / X670", "motherboards", { q: "B650" }),
          link("All motherboards", "motherboards"),
        ],
      },
    ],
  },
  {
    key: "graphics-cards",
    label: "Graphics Cards",
    href: browse("graphics-cards"),
    columns: [
      {
        heading: "NVIDIA GeForce",
        links: [
          link("RTX 3050 / 4060", "graphics-cards", { q: "RTX 4060" }),
          link("RTX 5060 / 5070", "graphics-cards", { q: "RTX 5070" }),
        ],
      },
      {
        heading: "AMD Radeon",
        links: [
          link("RX 7600 / 9060", "graphics-cards", { q: "RX" }),
          link("RX 9070 XT", "graphics-cards", { q: "9070" }),
          link("All graphics cards", "graphics-cards"),
        ],
      },
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
          link("DDR4", "memory-ram", { q: "DDR4" }),
          link("DDR5", "memory-ram", { q: "DDR5" }),
          link("RGB kits", "memory-ram", { q: "RGB" }),
        ],
      },
      {
        heading: "By capacity",
        links: [
          link("16GB", "memory-ram", { q: "16GB" }),
          link("32GB", "memory-ram", { q: "32GB" }),
          link("All memory", "memory-ram"),
        ],
      },
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
          link("NVMe (M.2)", "storage-ssd", { q: "NVMe" }),
          link("SATA (2.5\")", "storage-ssd", { q: "SATA" }),
        ],
      },
      {
        heading: "By capacity",
        links: [
          link("Up to 500GB", "storage-ssd", { q: "500GB" }),
          link("1TB", "storage-ssd", { q: "1TB" }),
          link("2TB", "storage-ssd", { q: "2TB" }),
          link("All SSDs", "storage-ssd"),
        ],
      },
    ],
  },
  {
    key: "cabinets",
    label: "Cabinets",
    href: browse("cabinets"),
    columns: [
      {
        heading: "Cases",
        links: [
          link("ARGB cabinets", "cabinets", { q: "ARGB" }),
          link("Airflow / mesh", "cabinets", { q: "mesh" }),
          link("Budget cabinets", "cabinets", { q: "Ant" }),
          link("All cabinets", "cabinets"),
        ],
      },
    ],
  },
  {
    key: "keyboard-mouse",
    label: "Keyboard & Mouse",
    href: browse("keyboard-mouse"),
    columns: [
      {
        heading: "Combos",
        links: [
          link("Wireless combos", "keyboard-mouse", { q: "wireless" }),
          link("Gaming combos", "keyboard-mouse", { q: "gaming" }),
          link("Budget combos", "keyboard-mouse", { q: "wired" }),
          link("All combos", "keyboard-mouse"),
        ],
      },
    ],
  },
  {
    key: "monitors",
    label: "Monitors",
    href: browse("monitors"),
    columns: [
      {
        heading: "By resolution",
        links: [
          link("Full HD (1080p)", "monitors", { q: "FHD" }),
          link("QHD (1440p)", "monitors", { q: "QHD" }),
          link("4K UHD", "monitors", { q: "4K" }),
        ],
      },
      {
        heading: "By use",
        links: [
          link("Gaming (high refresh)", "monitors", { q: "180Hz" }),
          link("Office", "monitors", { q: "100Hz" }),
          link("All monitors", "monitors"),
        ],
      },
    ],
  },
  {
    key: "ups",
    label: "UPS",
    href: browse("ups"),
    columns: [
      {
        heading: "Power backup",
        links: [
          link("600VA (single PC)", "ups", { q: "600VA" }),
          link("1000VA+", "ups", { q: "1000VA" }),
          link("Online UPS", "ups", { q: "online" }),
          link("All UPS", "ups"),
        ],
      },
    ],
  },
];

/** Homepage shop-by-category tiles — real component crops, dark wells. */
export const ASPERA_CATEGORY_TILES = [
  { id: "processors", label: "Processors", href: browse("processors"), imageUrl: "/category-tiles/pc-cpu.jpg", bgTint: "#121A2B" },
  { id: "graphics-cards", label: "Graphics Cards", href: browse("graphics-cards"), imageUrl: "/category-tiles/pc-gpu.jpg", bgTint: "#121A2B" },
  { id: "motherboards", label: "Motherboards", href: browse("motherboards"), imageUrl: "/category-tiles/pc-mobo.jpg", bgTint: "#121A2B" },
  { id: "memory-ram", label: "Memory", href: browse("memory-ram"), imageUrl: "/category-tiles/pc-ram.jpg", bgTint: "#121A2B" },
  { id: "storage-ssd", label: "SSD / Storage", href: browse("storage-ssd"), imageUrl: "/category-tiles/pc-ssd.jpg", bgTint: "#121A2B" },
  { id: "monitors", label: "Monitors", href: browse("monitors"), imageUrl: "/category-tiles/pc-monitor.jpg", bgTint: "#121A2B" },
  { id: "cabinets", label: "Cabinets", href: browse("cabinets"), imageUrl: "/category-tiles/pc-cabinet.jpg", bgTint: "#121A2B" },
  { id: "keyboard-mouse", label: "Keyboard & Mouse", href: browse("keyboard-mouse"), imageUrl: "/category-tiles/pc-keyboard.jpg", bgTint: "#121A2B" },
] as const;

/** Shop-by-brand lanes (PC brands). */
export const ASPERA_BRAND_LANES = [
  { id: "intel", label: "Intel", href: browse("processors", { q: "Intel" }), imageUrl: "/category-tiles/pc-brand-intel.jpg", bgTint: "#121A2B", offer: "Core processors" },
  { id: "amd", label: "AMD Ryzen", href: browse("processors", { q: "Ryzen" }), imageUrl: "/category-tiles/pc-brand-amd.jpg", bgTint: "#121A2B", offer: "Ryzen processors" },
  { id: "nvidia", label: "NVIDIA RTX", href: browse("graphics-cards", { q: "RTX" }), imageUrl: "/category-tiles/pc-brand-nvidia.jpg", bgTint: "#121A2B", offer: "GeForce GPUs" },
  { id: "asus", label: "ASUS", href: browse("motherboards", { q: "ASUS" }), imageUrl: "/category-tiles/pc-brand-asus.jpg", bgTint: "#121A2B", offer: "Boards & more" },
  { id: "corsair", label: "Corsair", href: browse("memory-ram", { q: "Corsair" }), imageUrl: "/category-tiles/pc-brand-corsair.jpg", bgTint: "#121A2B", offer: "Memory & cases" },
  { id: "samsung", label: "Samsung", href: browse("storage-ssd", { q: "Samsung" }), imageUrl: "/category-tiles/pc-brand-samsung.jpg", bgTint: "#121A2B", offer: "SSDs & monitors" },
  { id: "logitech", label: "Logitech", href: browse("keyboard-mouse", { q: "Logitech" }), imageUrl: "/category-tiles/pc-brand-logitech.jpg", bgTint: "#121A2B", offer: "Combos" },
  { id: "apc", label: "APC", href: browse("ups", { q: "APC" }), imageUrl: "/category-tiles/pc-brand-apc.jpg", bgTint: "#121A2B", offer: "Power backup" },
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
