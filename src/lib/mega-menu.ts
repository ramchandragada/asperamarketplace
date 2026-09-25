export type MegaMenuColumn = {
  heading: string;
  links: Array<{ label: string; href: string; imageUrl?: string }>;
};

export type MegaMenuCategory = {
  key: string;
  label: string;
  href: string;
  columns: MegaMenuColumn[];
};

function browse(categorySlug: string, q?: string) {
  const params = new URLSearchParams({ categorySlug });
  if (q) params.set("q", q);
  return `/browse?${params.toString()}`;
}

function browseQ(q: string) {
  return `/browse?${new URLSearchParams({ q }).toString()}`;
}

const THUMB = {
  dress:
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=120&q=70",
  top: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=120&q=70",
  saree:
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=120&q=70",
  shirt:
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=120&q=70",
  bag: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=120&q=70",
  beauty:
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=120&q=70",
  home: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=120&q=70",
  kids: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=120&q=70",
  electronics:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=120&q=70",
  watch:
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=70",
  sports:
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=120&q=70",
  car: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=120&q=70",
  office:
    "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=120&q=70",
} as const;

export const POPULAR_NAV = {
  key: "popular",
  label: "Popular",
  href: "/popular",
} as const;

/**
 * Exact Meesho web category bar order + labels (from live Meesho screenshot).
 */
export const MEGA_MENU: MegaMenuCategory[] = [
  {
    key: "kurti-saree-lehenga",
    label: "Kurti, Saree & Lehenga",
    href: browse("fashion", "kurta"),
    columns: [
      {
        heading: "Kurtis & Kurtas",
        links: [
          { label: "Kurtas", href: browse("fashion", "kurta"), imageUrl: THUMB.saree },
          { label: "Kurti sets", href: browse("fashion", "set"), imageUrl: THUMB.saree },
          { label: "Handloom kurtas", href: browse("fashion", "handloom"), imageUrl: THUMB.saree },
        ],
      },
      {
        heading: "Sarees & Dupattas",
        links: [
          { label: "Sarees", href: browse("fashion", "saree"), imageUrl: THUMB.saree },
          { label: "Dupattas", href: browse("fashion", "dupatta"), imageUrl: THUMB.saree },
          { label: "Blouses", href: browse("fashion", "blouse") },
        ],
      },
      {
        heading: "Lehengas & Ethnic",
        links: [
          { label: "Lehengas", href: browse("fashion", "lehenga"), imageUrl: THUMB.dress },
          { label: "Ethnic wear", href: browse("fashion", "ethnic"), imageUrl: THUMB.saree },
          { label: "Palazzo sets", href: browse("fashion", "palazzo") },
        ],
      },
    ],
  },
  {
    key: "women-western",
    label: "Women Western",
    href: browse("fashion", "dress"),
    columns: [
      {
        heading: "Tops & Tees",
        links: [
          { label: "Tops", href: browse("fashion", "top"), imageUrl: THUMB.top },
          { label: "T-shirts", href: browse("fashion", "tee"), imageUrl: THUMB.top },
          { label: "Shirts", href: browse("fashion", "shirt"), imageUrl: THUMB.shirt },
        ],
      },
      {
        heading: "Dresses & Jumpsuits",
        links: [
          { label: "Dresses", href: browse("fashion", "dress"), imageUrl: THUMB.dress },
          { label: "Jumpsuits", href: browse("fashion", "jumpsuit"), imageUrl: THUMB.dress },
        ],
      },
      {
        heading: "Bottomwear",
        links: [
          { label: "Jeans", href: browse("fashion", "jean") },
          { label: "Jegging", href: browse("fashion", "jegging") },
          { label: "Skirts", href: browse("fashion", "skirt") },
        ],
      },
    ],
  },
  {
    key: "lingerie",
    label: "Lingerie",
    href: browse("fashion", "pyjama"),
    columns: [
      {
        heading: "Innerwear",
        links: [
          { label: "Bras", href: browseQ("bra") },
          { label: "Panties", href: browseQ("panty") },
          { label: "Camisoles", href: browseQ("camisole") },
        ],
      },
      {
        heading: "Sleepwear",
        links: [
          { label: "Nightwear", href: browse("fashion", "pyjama") },
          { label: "Pyjama sets", href: browse("fashion", "pyjama") },
        ],
      },
    ],
  },
  {
    key: "men",
    label: "Men",
    href: browse("fashion", "shirt"),
    columns: [
      {
        heading: "Topwear",
        links: [
          { label: "Shirts", href: browse("fashion", "shirt"), imageUrl: THUMB.shirt },
          { label: "T-shirts", href: browse("fashion", "tee") },
          { label: "Kurtas", href: browse("fashion", "kurta") },
        ],
      },
      {
        heading: "Bottomwear",
        links: [
          { label: "Jeans", href: browse("fashion", "jean") },
          { label: "Trousers", href: browse("fashion", "trouser") },
          { label: "Shorts", href: browse("sports-fitness", "short") },
        ],
      },
    ],
  },
  {
    key: "kids-toys",
    label: "Kids & Toys",
    href: browse("baby-kids"),
    columns: [
      {
        heading: "Baby essentials",
        links: [
          { label: "Onesies", href: browse("baby-kids", "onesie"), imageUrl: THUMB.kids },
          { label: "Swaddles", href: browse("baby-kids", "swaddle") },
          { label: "Feeding", href: browse("baby-kids", "bib") },
        ],
      },
      {
        heading: "Toys & Fun",
        links: [
          { label: "Soft toys", href: browse("baby-kids", "plush") },
          { label: "Stacking toys", href: browse("baby-kids", "toy") },
          { label: "Books", href: browse("baby-kids", "book") },
        ],
      },
    ],
  },
  {
    key: "home-kitchen",
    label: "Home & Kitchen",
    href: browse("home-kitchen"),
    columns: [
      {
        heading: "Cookware",
        links: [
          { label: "Tawas & pans", href: browse("home-kitchen", "tawa"), imageUrl: THUMB.home },
          { label: "Knives", href: browse("home-kitchen", "knife") },
          { label: "Kettles", href: browse("home-kitchen", "kettle") },
        ],
      },
      {
        heading: "Home living",
        links: [
          { label: "Cushion covers", href: browse("home-kitchen", "cushion") },
          { label: "Cleaning", href: browse("household-essentials") },
        ],
      },
    ],
  },
  {
    key: "beauty-health",
    label: "Beauty & Health",
    href: browse("beauty-personal-care"),
    columns: [
      {
        heading: "Skincare",
        links: [
          {
            label: "Face wash",
            href: browse("beauty-personal-care", "face"),
            imageUrl: THUMB.beauty,
          },
          { label: "Moisturiser", href: browse("beauty-personal-care", "moistur") },
          { label: "Serum", href: browse("beauty-personal-care", "serum") },
        ],
      },
      {
        heading: "Hair & body",
        links: [
          { label: "Hair oil", href: browse("beauty-personal-care", "oil") },
          { label: "Body lotion", href: browse("beauty-personal-care", "lotion") },
        ],
      },
    ],
  },
  {
    key: "jewellery-accessories",
    label: "Jewellery & Accessories",
    href: browseQ("earring"),
    columns: [
      {
        heading: "Jewellery",
        links: [
          { label: "Earrings", href: browseQ("earring") },
          { label: "Necklaces", href: browseQ("necklace") },
          { label: "Bangles", href: browseQ("bangle") },
          { label: "Rings", href: browseQ("ring") },
        ],
      },
      {
        heading: "Accessories",
        links: [
          { label: "Belts", href: browse("bags-footwear", "belt") },
          { label: "Scarves", href: browse("fashion", "scarf") },
        ],
      },
    ],
  },
  {
    key: "bags-footwear",
    label: "Bags & Footwear",
    href: browse("bags-footwear"),
    columns: [
      {
        heading: "Bags",
        links: [
          { label: "Handbags", href: browse("bags-footwear", "sling"), imageUrl: THUMB.bag },
          { label: "Backpacks", href: browse("bags-footwear", "backpack") },
          { label: "Totes", href: browse("bags-footwear", "tote") },
        ],
      },
      {
        heading: "Footwear",
        links: [
          { label: "Sandals", href: browse("bags-footwear", "sandal") },
          { label: "Sneakers", href: browse("bags-footwear", "sneaker") },
          { label: "Slippers", href: browse("bags-footwear", "slipper") },
        ],
      },
    ],
  },
  {
    key: "electronics",
    label: "Electronics",
    href: browse("electronics-accessories"),
    columns: [
      {
        heading: "Audio & gadgets",
        links: [
          {
            label: "Earbuds",
            href: browse("electronics-accessories", "earbud"),
            imageUrl: THUMB.electronics,
          },
          { label: "Headphones", href: browse("electronics-accessories", "headphone") },
          { label: "Speakers", href: browse("electronics-accessories", "speaker") },
        ],
      },
      {
        heading: "Accessories",
        links: [
          { label: "Chargers", href: browse("electronics-accessories", "charger") },
          { label: "Cables", href: browse("electronics-accessories", "cable") },
        ],
      },
    ],
  },
  {
    key: "watches",
    label: "Watches",
    href: browse("electronics-accessories", "watch"),
    columns: [
      {
        heading: "Watches",
        links: [
          {
            label: "Analog watches",
            href: browse("electronics-accessories", "watch"),
            imageUrl: THUMB.watch,
          },
          { label: "Smart watches", href: browse("electronics-accessories", "smart") },
          { label: "Fitness bands", href: browse("health-wellness", "band") },
        ],
      },
    ],
  },
  {
    key: "sports-fitness",
    label: "Sports & Fitness",
    href: browse("sports-fitness"),
    columns: [
      {
        heading: "Fitness",
        links: [
          {
            label: "Yoga mats",
            href: browse("sports-fitness", "yoga"),
            imageUrl: THUMB.sports,
          },
          { label: "Dumbbells", href: browse("sports-fitness", "dumbbell") },
          { label: "Running shoes", href: browse("sports-fitness", "shoe") },
        ],
      },
    ],
  },
  {
    key: "car-motorbike",
    label: "Car & Motorbike",
    href: browse("general-merchandise", "car"),
    columns: [
      {
        heading: "Vehicle care",
        links: [
          {
            label: "Car accessories",
            href: browse("general-merchandise", "car"),
            imageUrl: THUMB.car,
          },
          { label: "Bike accessories", href: browse("general-merchandise", "bike") },
          { label: "Cleaning", href: browse("household-essentials", "clean") },
        ],
      },
    ],
  },
  {
    key: "office-supplies",
    label: "Office Supplies",
    href: browse("general-merchandise", "pen"),
    columns: [
      {
        heading: "Stationery",
        links: [
          {
            label: "Pens & notebooks",
            href: browse("general-merchandise", "pen"),
            imageUrl: THUMB.office,
          },
          { label: "Folders", href: browse("general-merchandise", "folder") },
          { label: "Desk organisers", href: browse("general-merchandise", "organiser") },
        ],
      },
    ],
  },
];

export function buildAllCategoriesMenu(): {
  href: string;
  columns: MegaMenuColumn[];
} {
  return {
    href: "/shop",
    columns: [
      ...MEGA_MENU.slice(0, 5).map((entry) => ({
        heading: entry.label,
        links: [
          ...(entry.columns[0]?.links ?? []).slice(0, 4),
          { label: `Shop ${entry.label}`, href: entry.href },
        ],
      })),
      {
        heading: "More categories",
        links: [
          ...MEGA_MENU.slice(5).map((entry) => ({
            label: entry.label,
            href: entry.href,
          })),
          { label: "View all categories →", href: "/shop" },
        ],
      },
    ],
  };
}

export const ALL_CATEGORIES_MENU = buildAllCategoriesMenu();

export const TRENDING_SEARCHES = [
  "saree",
  "kurti",
  "lehenga",
  "jeans",
  "earbuds",
  "face wash",
];

export const SEARCH_PLACEHOLDER =
  "Try Saree, Kurti or Search by Product Code";

/** Meesho homepage arched category row (exact labels from screenshot). */
export const MEESHO_ARCH_CATEGORIES = [
  {
    id: "ethnic",
    label: "Ethnic Wear",
    href: browse("fashion", "saree"),
    imageUrl:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "western",
    label: "Western Dresses",
    href: browse("fashion", "dress"),
    imageUrl:
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "menswear",
    label: "Menswear",
    href: browse("fashion", "shirt"),
    imageUrl:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "footwear",
    label: "Footwear",
    href: browse("bags-footwear", "sneaker"),
    imageUrl:
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "home-decor",
    label: "Home Decor",
    href: browse("home-kitchen", "cushion"),
    imageUrl:
      "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "beauty",
    label: "Beauty",
    href: browse("beauty-personal-care"),
    imageUrl:
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "accessories",
    label: "Accessories",
    href: browse("bags-footwear", "sling"),
    imageUrl:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "grocery",
    label: "Grocery",
    href: browse("household-essentials"),
    imageUrl:
      "https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&w=400&q=80",
  },
] as const;
