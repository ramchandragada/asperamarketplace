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

const THUMB = {
  fashion:
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=120&q=70",
  men: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&w=120&q=70",
  kids: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=120&q=70",
  beauty:
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=120&q=70",
  home: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=120&q=70",
  electronics:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=120&q=70",
  footwear:
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=120&q=70",
  bag: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=120&q=70",
  jewellery:
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=120&q=70",
  grocery:
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=70",
  sports:
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=120&q=70",
  health:
    "https://images.unsplash.com/photo-1505751172870-922d2ed4d4f6?auto=format&fit=crop&w=120&q=70",
  stationery:
    "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=120&q=70",
  auto: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=120&q=70",
  pet: "https://images.unsplash.com/photo-1587300003388-59208cc962f0?auto=format&fit=crop&w=120&q=70",
} as const;

export const SEARCH_PLACEHOLDER =
  "Search products, brands, or categories";

export const TRENDING_SEARCHES = [
  "kurtas",
  "sneakers",
  "skincare",
  "earphones",
  "home decor",
  "backpacks",
] as const;

/**
 * Aspera category navigation — original IA mapped to seeded catalogue slugs.
 * Not a Meesho label/order copy.
 */
export const MEGA_MENU: MegaMenuCategory[] = [
  {
    key: "women",
    label: "Women",
    href: browse("fashion"),
    columns: [
      {
        heading: "Ethnic & festive",
        links: [
          { label: "Kurtas & sets", href: browse("fashion", "kurta"), imageUrl: THUMB.fashion },
          { label: "Sarees", href: browse("fashion", "saree"), imageUrl: THUMB.fashion },
          { label: "Lehengas", href: browse("fashion", "lehenga"), imageUrl: THUMB.fashion },
        ],
      },
      {
        heading: "Everyday wear",
        links: [
          { label: "Dresses", href: browse("fashion", "dress"), imageUrl: THUMB.fashion },
          { label: "Tops", href: browse("fashion", "top"), imageUrl: THUMB.fashion },
          { label: "Bottoms", href: browse("fashion", "pant") },
        ],
      },
      {
        heading: "Collections",
        links: [
          { label: "Under ₹599", href: "/browse?categorySlug=fashion&maxPricePaise=59900" },
          { label: "New in fashion", href: "/shop?categorySlug=fashion&sort=newest" },
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
        heading: "Apparel",
        links: [
          { label: "Shirts", href: browse("fashion", "shirt"), imageUrl: THUMB.men },
          { label: "T-shirts", href: browse("fashion", "tee"), imageUrl: THUMB.men },
          { label: "Ethnic wear", href: browse("fashion", "kurta"), imageUrl: THUMB.men },
        ],
      },
      {
        heading: "Accessories",
        links: [
          { label: "Watches", href: browse("electronics-accessories", "watch"), imageUrl: THUMB.electronics },
          { label: "Bags", href: browse("bags-footwear", "bag"), imageUrl: THUMB.bag },
        ],
      },
    ],
  },
  {
    key: "kids",
    label: "Kids",
    href: browse("baby-kids"),
    columns: [
      {
        heading: "Kids & baby",
        links: [
          { label: "Toys", href: browse("baby-kids", "toy"), imageUrl: THUMB.kids },
          { label: "Clothing", href: browse("baby-kids", "cloth"), imageUrl: THUMB.kids },
          { label: "Care essentials", href: browse("baby-kids"), imageUrl: THUMB.kids },
        ],
      },
    ],
  },
  {
    key: "beauty",
    label: "Beauty",
    href: browse("beauty-personal-care"),
    columns: [
      {
        heading: "Personal care",
        links: [
          { label: "Skincare", href: browse("beauty-personal-care", "face"), imageUrl: THUMB.beauty },
          { label: "Makeup", href: browse("beauty-personal-care", "lip"), imageUrl: THUMB.beauty },
          { label: "Haircare", href: browse("beauty-personal-care", "oil"), imageUrl: THUMB.beauty },
        ],
      },
    ],
  },
  {
    key: "home",
    label: "Home",
    href: browse("home-kitchen"),
    columns: [
      {
        heading: "Home & kitchen",
        links: [
          { label: "Kitchen", href: browse("home-kitchen", "kitchen"), imageUrl: THUMB.home },
          { label: "Decor", href: browse("home-kitchen", "decor"), imageUrl: THUMB.home },
          { label: "Storage", href: browse("home-kitchen", "storage"), imageUrl: THUMB.home },
          { label: "Household", href: browse("household-essentials"), imageUrl: THUMB.home },
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
        heading: "Gadgets",
        links: [
          { label: "Audio", href: browse("electronics-accessories", "ear"), imageUrl: THUMB.electronics },
          { label: "Mobile accessories", href: browse("mobile-accessories"), imageUrl: THUMB.electronics },
          { label: "Wearables", href: browse("electronics-accessories", "watch"), imageUrl: THUMB.electronics },
        ],
      },
    ],
  },
  {
    key: "footwear",
    label: "Footwear",
    href: browse("bags-footwear", "shoe"),
    columns: [
      {
        heading: "Shoes",
        links: [
          { label: "Sneakers", href: browse("bags-footwear", "sneaker"), imageUrl: THUMB.footwear },
          { label: "Sandals", href: browse("bags-footwear", "sandal"), imageUrl: THUMB.footwear },
          { label: "Formal", href: browse("bags-footwear", "formal"), imageUrl: THUMB.footwear },
        ],
      },
    ],
  },
  {
    key: "bags",
    label: "Bags",
    href: browse("bags-footwear", "bag"),
    columns: [
      {
        heading: "Bags",
        links: [
          { label: "Backpacks", href: browse("bags-footwear", "backpack"), imageUrl: THUMB.bag },
          { label: "Handbags", href: browse("bags-footwear", "handbag"), imageUrl: THUMB.bag },
          { label: "Travel", href: browse("bags-footwear", "travel"), imageUrl: THUMB.bag },
        ],
      },
    ],
  },
  {
    key: "jewellery",
    label: "Jewellery",
    href: browse("fashion", "jewellery"),
    columns: [
      {
        heading: "Jewellery",
        links: [
          { label: "Earrings", href: browse("fashion", "earring"), imageUrl: THUMB.jewellery },
          { label: "Necklaces", href: browse("fashion", "necklace"), imageUrl: THUMB.jewellery },
          { label: "Bangles", href: browse("fashion", "bangle"), imageUrl: THUMB.jewellery },
        ],
      },
    ],
  },
  {
    key: "grocery",
    label: "Grocery",
    href: browse("household-essentials"),
    columns: [
      {
        heading: "Daily needs",
        links: [
          { label: "Pantry", href: browse("household-essentials"), imageUrl: THUMB.grocery },
          { label: "Cleaning", href: browse("household-essentials", "clean"), imageUrl: THUMB.grocery },
        ],
      },
    ],
  },
  {
    key: "sports",
    label: "Sports",
    href: browse("sports-fitness"),
    columns: [
      {
        heading: "Sports & fitness",
        links: [
          { label: "Fitness gear", href: browse("sports-fitness"), imageUrl: THUMB.sports },
          { label: "Yoga", href: browse("sports-fitness", "yoga"), imageUrl: THUMB.sports },
        ],
      },
    ],
  },
  {
    key: "health",
    label: "Health",
    href: browse("health-wellness"),
    columns: [
      {
        heading: "Wellness",
        links: [
          { label: "Supplements", href: browse("health-wellness"), imageUrl: THUMB.health },
          { label: "Personal care", href: browse("beauty-personal-care"), imageUrl: THUMB.beauty },
        ],
      },
    ],
  },
  {
    key: "stationery",
    label: "Stationery",
    href: browse("stationery-office"),
    columns: [
      {
        heading: "Office & study",
        links: [
          { label: "Notebooks", href: browse("stationery-office", "note"), imageUrl: THUMB.stationery },
          { label: "Desk essentials", href: browse("stationery-office"), imageUrl: THUMB.stationery },
        ],
      },
    ],
  },
  {
    key: "automotive",
    label: "Automotive",
    href: browse("electronics-accessories", "car"),
    columns: [
      {
        heading: "Car & bike",
        links: [
          { label: "Accessories", href: browse("electronics-accessories", "car"), imageUrl: THUMB.auto },
        ],
      },
    ],
  },
  {
    key: "pet-supplies",
    label: "Pet Supplies",
    href: browse("household-essentials", "pet"),
    columns: [
      {
        heading: "Pets",
        links: [
          { label: "Pet care", href: browse("household-essentials", "pet"), imageUrl: THUMB.pet },
        ],
      },
    ],
  },
];

/** Homepage shop-by-category tiles (subset with imagery). */
export const ASPERA_CATEGORY_TILES = [
  {
    id: "women",
    label: "Women",
    href: browse("fashion"),
    imageUrl:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "men",
    label: "Men",
    href: browse("fashion", "shirt"),
    imageUrl:
      "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "kids",
    label: "Kids",
    href: browse("baby-kids"),
    imageUrl:
      "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "beauty",
    label: "Beauty",
    href: browse("beauty-personal-care"),
    imageUrl:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "home",
    label: "Home",
    href: browse("home-kitchen"),
    imageUrl:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "electronics",
    label: "Electronics",
    href: browse("electronics-accessories"),
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "footwear",
    label: "Footwear",
    href: browse("bags-footwear", "shoe"),
    imageUrl:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "bags",
    label: "Bags",
    href: browse("bags-footwear", "bag"),
    imageUrl:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "jewellery",
    label: "Jewellery",
    href: browse("fashion", "jewellery"),
    imageUrl:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "sports",
    label: "Sports",
    href: browse("sports-fitness"),
    imageUrl:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80",
  },
] as const;

/** @deprecated Prefer ASPERA_CATEGORY_TILES — kept for temporary import compatibility */
export const MEESHO_ARCH_CATEGORIES = ASPERA_CATEGORY_TILES.map((tile) => ({
  id: tile.id,
  label: tile.label,
  href: tile.href,
  imageUrl: tile.imageUrl,
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
