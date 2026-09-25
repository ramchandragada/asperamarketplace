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

function browse(categorySlug: string, q?: string) {
  const params = new URLSearchParams({ categorySlug });
  if (q) params.set("q", q);
  return `/browse?${params.toString()}`;
}

function browseQ(q: string) {
  return `/browse?${new URLSearchParams({ q }).toString()}`;
}

/**
 * Meesho-style gender/occasion mega-menu.
 * Links map into existing /browse catalogue filters (no catalogue schema change).
 */
export const MEGA_MENU: MegaMenuCategory[] = [
  {
    key: "women-western",
    label: "Women Western",
    href: browse("fashion", "dress"),
    columns: [
      {
        heading: "Tops & Tees",
        links: [
          { label: "Tops", href: browse("fashion", "top") },
          { label: "T-shirts", href: browse("fashion", "tee") },
          { label: "Shirts", href: browse("fashion", "shirt") },
          { label: "Tunics", href: browse("fashion", "tunic") },
        ],
      },
      {
        heading: "Dresses & Jumpsuits",
        links: [
          { label: "Dresses", href: browse("fashion", "dress") },
          { label: "Wrap dresses", href: browse("fashion", "wrap") },
          { label: "Jumpsuits", href: browse("fashion", "jumpsuit") },
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
    key: "kurti-saree-lehenga",
    label: "Kurti, Saree & Lehenga",
    href: browse("fashion", "kurta"),
    columns: [
      {
        heading: "Kurtis & Kurtas",
        links: [
          { label: "Kurtas", href: browse("fashion", "kurta") },
          { label: "Kurti sets", href: browse("fashion", "set") },
          { label: "Handloom kurtas", href: browse("fashion", "handloom") },
        ],
      },
      {
        heading: "Sarees & Dupattas",
        links: [
          { label: "Sarees", href: browse("fashion", "saree") },
          { label: "Dupattas", href: browse("fashion", "dupatta") },
          { label: "Blouses", href: browse("fashion", "blouse") },
        ],
      },
      {
        heading: "Lehengas & Ethnic",
        links: [
          { label: "Lehengas", href: browse("fashion", "lehenga") },
          { label: "Ethnic wear", href: browse("fashion", "ethnic") },
          { label: "Palazzo sets", href: browse("fashion", "palazzo") },
        ],
      },
      {
        heading: "Occasion",
        links: [
          { label: "Festive", href: browse("fashion", "festive") },
          { label: "Wedding", href: browse("fashion", "wedding") },
          { label: "Daily wear", href: browse("fashion", "cotton") },
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
          { label: "Robes", href: browseQ("robe") },
        ],
      },
      {
        heading: "Shapewear & Socks",
        links: [
          { label: "Shapewear", href: browseQ("shapewear") },
          { label: "Socks", href: browse("bags-footwear", "sock") },
          { label: "Thermals", href: browseQ("thermal") },
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
          { label: "Shirts", href: browse("fashion", "shirt") },
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
    key: "kids-toys",
    label: "Kids & Toys",
    href: browse("baby-kids"),
    columns: [
      {
        heading: "Baby essentials",
        links: [
          { label: "Onesies", href: browse("baby-kids", "onesie") },
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
          { label: "Tawas & pans", href: browse("home-kitchen", "tawa") },
          { label: "Knives", href: browse("home-kitchen", "knife") },
          { label: "Spatulas", href: browse("home-kitchen", "spatula") },
          { label: "Kettles", href: browse("home-kitchen", "kettle") },
        ],
      },
      {
        heading: "Storage & Serve",
        links: [
          { label: "Containers", href: browse("home-kitchen", "container") },
          { label: "Tiffin", href: browse("home-kitchen", "tiffin") },
          { label: "Bowls", href: browse("home-kitchen", "bowl") },
          { label: "Spice jars", href: browse("home-kitchen", "spice") },
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
          { label: "Face wash", href: browse("beauty-personal-care", "face") },
          { label: "Moisturiser", href: browse("beauty-personal-care", "moistur") },
          { label: "Serum", href: browse("beauty-personal-care", "serum") },
          { label: "Face mask", href: browse("beauty-personal-care", "mask") },
        ],
      },
      {
        heading: "Hair & body",
        links: [
          { label: "Hair oil", href: browse("beauty-personal-care", "oil") },
          { label: "Body lotion", href: browse("beauty-personal-care", "lotion") },
          { label: "Soap", href: browse("beauty-personal-care", "soap") },
          { label: "Lip balm", href: browse("beauty-personal-care", "lip") },
        ],
      },
      {
        heading: "Health & fitness",
        links: [
          { label: "Yoga mats", href: browse("health-wellness", "yoga") },
          { label: "Resistance bands", href: browse("health-wellness", "band") },
          { label: "Scales", href: browse("health-wellness", "scale") },
          { label: "Sports gear", href: browse("sports-fitness") },
        ],
      },
    ],
  },
  {
    key: "jewellery-accessories",
    label: "Jewellery & Accessories",
    href: browse("fashion", "scarf"),
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
        heading: "Watches & Wearables",
        links: [
          { label: "Watches", href: browse("electronics-accessories", "watch") },
          { label: "Fitness bands", href: browse("health-wellness", "band") },
        ],
      },
      {
        heading: "Everyday accessories",
        links: [
          { label: "Belts", href: browse("bags-footwear", "belt") },
          { label: "Scarves", href: browse("fashion", "scarf") },
          { label: "Hair accessories", href: browseQ("hair") },
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
          { label: "Handbags", href: browse("bags-footwear", "sling") },
          { label: "Backpacks", href: browse("bags-footwear", "backpack") },
          { label: "Totes", href: browse("bags-footwear", "tote") },
          { label: "Duffels", href: browse("bags-footwear", "duffel") },
        ],
      },
      {
        heading: "Footwear",
        links: [
          { label: "Sandals", href: browse("bags-footwear", "sandal") },
          { label: "Sneakers", href: browse("bags-footwear", "sneaker") },
          { label: "Slippers", href: browse("bags-footwear", "slipper") },
          { label: "Running shoes", href: browse("sports-fitness", "shoe") },
        ],
      },
      {
        heading: "Travel",
        links: [
          { label: "Packing cubes", href: browse("bags-footwear", "cube") },
          { label: "Weekenders", href: browse("bags-footwear", "weekender") },
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
