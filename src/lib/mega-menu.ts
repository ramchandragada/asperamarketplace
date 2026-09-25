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
    "https://images.unsplash.com/photo-1610030469983-98e550d85b9a?auto=format&fit=crop&w=120&q=70",
  shirt:
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=120&q=70",
  bag: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=120&q=70",
  beauty:
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=120&q=70",
  home: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=120&q=70",
  kids: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=120&q=70",
  electronics:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=120&q=70",
  sports:
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=120&q=70",
} as const;

export const POPULAR_NAV = {
  key: "popular",
  label: "Popular",
  href: "/popular",
} as const;

/**
 * Meesho web category IA (labels + order), mapped to Aspera catalogue slugs.
 */
export const MEGA_MENU: MegaMenuCategory[] = [
  {
    key: "women-ethnic",
    label: "Women Ethnic",
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
        heading: "Lehengas & Sets",
        links: [
          { label: "Lehengas", href: browse("fashion", "lehenga"), imageUrl: THUMB.dress },
          { label: "Ethnic wear", href: browse("fashion", "ethnic"), imageUrl: THUMB.saree },
          { label: "Palazzo sets", href: browse("fashion", "palazzo") },
        ],
      },
      {
        heading: "Lingerie & Sleepwear",
        links: [
          { label: "Nightwear", href: browse("fashion", "pyjama") },
          { label: "Camisoles", href: browseQ("camisole") },
          { label: "Shapewear", href: browseQ("shapewear") },
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
          { label: "Palazzo", href: browse("fashion", "palazzo") },
          { label: "Skirts", href: browse("fashion", "skirt") },
        ],
      },
      {
        heading: "Winter & Lounge",
        links: [
          { label: "Hoodies", href: browse("fashion", "hoodie") },
          { label: "Scarves", href: browse("fashion", "scarf") },
          { label: "Pyjamas", href: browse("fashion", "pyjama") },
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
      {
        heading: "Ethnic & Winter",
        links: [
          { label: "Ethnic wear", href: browse("fashion", "ethnic") },
          { label: "Jackets", href: browseQ("jacket") },
          { label: "Sweatshirts", href: browse("fashion", "hoodie") },
        ],
      },
      {
        heading: "Accessories",
        links: [
          { label: "Belts", href: browse("bags-footwear", "belt") },
          { label: "Wallets", href: browse("bags-footwear", "wallet") },
          { label: "Caps", href: browseQ("cap") },
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
        heading: "Baby essentials",
        links: [
          { label: "Onesies", href: browse("baby-kids", "onesie"), imageUrl: THUMB.kids },
          { label: "Swaddles", href: browse("baby-kids", "swaddle") },
          { label: "Feeding", href: browse("baby-kids", "bib") },
        ],
      },
      {
        heading: "Kids wear",
        links: [
          { label: "Hoodies", href: browse("fashion", "kids") },
          { label: "Raincoats", href: browse("baby-kids", "rain") },
          { label: "Footwear", href: browse("bags-footwear", "kids") },
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
        heading: "Storage & Serve",
        links: [
          { label: "Containers", href: browse("home-kitchen", "container") },
          { label: "Tiffin", href: browse("home-kitchen", "tiffin") },
          { label: "Bowls", href: browse("home-kitchen", "bowl") },
        ],
      },
      {
        heading: "Home living",
        links: [
          { label: "Cushion covers", href: browse("home-kitchen", "cushion") },
          { label: "Laundry", href: browse("general-merchandise", "laundry") },
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
          { label: "Face wash", href: browse("beauty-personal-care", "face"), imageUrl: THUMB.beauty },
          { label: "Moisturiser", href: browse("beauty-personal-care", "moistur") },
          { label: "Serum", href: browse("beauty-personal-care", "serum") },
        ],
      },
      {
        heading: "Hair & body",
        links: [
          { label: "Hair oil", href: browse("beauty-personal-care", "oil") },
          { label: "Body lotion", href: browse("beauty-personal-care", "lotion") },
          { label: "Soap", href: browse("beauty-personal-care", "soap") },
        ],
      },
      {
        heading: "Wellness",
        links: [
          { label: "Yoga mats", href: browse("health-wellness", "yoga") },
          { label: "Scales", href: browse("health-wellness", "scale") },
        ],
      },
    ],
  },
  {
    key: "jewellery",
    label: "Jewellery",
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
        heading: "Watches",
        links: [
          { label: "Watches", href: browse("electronics-accessories", "watch") },
          { label: "Fitness bands", href: browse("health-wellness", "band") },
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
          { label: "Watches", href: browse("electronics-accessories", "watch") },
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
          { label: "Resistance bands", href: browse("health-wellness", "band") },
        ],
      },
      {
        heading: "Sportswear",
        links: [
          { label: "Shorts", href: browse("sports-fitness", "short") },
          { label: "Running shoes", href: browse("sports-fitness", "shoe") },
          { label: "Socks", href: browse("bags-footwear", "sock") },
        ],
      },
    ],
  },
];

/** All-categories mega panel: one column per top category, max 5 visible + view-all. */
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
