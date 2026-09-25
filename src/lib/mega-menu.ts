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

/** Storefront mega-menu — links into existing /browse filters. */
export const MEGA_MENU: MegaMenuCategory[] = [
  {
    key: "fashion",
    label: "Fashion",
    href: browse("fashion"),
    columns: [
      {
        heading: "Women ethnic",
        links: [
          { label: "Kurtas", href: browse("fashion", "kurta") },
          { label: "Sarees", href: browse("fashion", "saree") },
          { label: "Dupattas", href: browse("fashion", "dupatta") },
          { label: "Kurta sets", href: browse("fashion", "set") },
        ],
      },
      {
        heading: "Women western",
        links: [
          { label: "Tops", href: browse("fashion", "top") },
          { label: "Dresses", href: browse("fashion", "dress") },
          { label: "Jeans", href: browse("fashion", "jeans") },
          { label: "T-shirts", href: browse("fashion", "t-shirt") },
        ],
      },
      {
        heading: "Men",
        links: [
          { label: "Shirts", href: browse("fashion", "shirt") },
          { label: "T-shirts", href: browse("fashion", "tee") },
          { label: "Trousers", href: browse("fashion", "trouser") },
          { label: "Ethnic wear", href: browse("fashion", "ethnic") },
        ],
      },
      {
        heading: "Accessories",
        links: [
          { label: "Scarves", href: browse("fashion", "scarf") },
          { label: "Belts", href: browse("bags-footwear", "belt") },
          { label: "Watches", href: browse("electronics-accessories", "watch") },
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
        heading: "Audio",
        links: [
          { label: "Earbuds", href: browse("electronics-accessories", "earbud") },
          { label: "Headphones", href: browse("electronics-accessories", "headphone") },
          { label: "Speakers", href: browse("electronics-accessories", "speaker") },
        ],
      },
      {
        heading: "Power",
        links: [
          { label: "Chargers", href: browse("electronics-accessories", "charger") },
          { label: "Power banks", href: browse("electronics-accessories", "power") },
          { label: "Cables", href: browse("mobile-accessories", "cable") },
        ],
      },
      {
        heading: "Wearables",
        links: [
          { label: "Smart watches", href: browse("electronics-accessories", "watch") },
          { label: "Fitness bands", href: browse("health-wellness", "band") },
        ],
      },
    ],
  },
  {
    key: "home",
    label: "Home & Kitchen",
    href: browse("home-kitchen"),
    columns: [
      {
        heading: "Cookware",
        links: [
          { label: "Pans", href: browse("home-kitchen", "pan") },
          { label: "Utensils", href: browse("home-kitchen", "utensil") },
          { label: "Storage", href: browse("home-kitchen", "storage") },
        ],
      },
      {
        heading: "Living",
        links: [
          { label: "Bedsheets", href: browse("home-kitchen", "bedsheet") },
          { label: "Curtains", href: browse("home-kitchen", "curtain") },
          { label: "Organisers", href: browse("home-kitchen", "organiser") },
        ],
      },
      {
        heading: "Cleaning",
        links: [
          { label: "Household", href: browse("household-essentials") },
          { label: "Laundry", href: browse("household-essentials", "laundry") },
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
        heading: "Skincare",
        links: [
          { label: "Face wash", href: browse("beauty-personal-care", "face") },
          { label: "Moisturiser", href: browse("beauty-personal-care", "moistur") },
          { label: "Sunscreen", href: browse("beauty-personal-care", "sun") },
        ],
      },
      {
        heading: "Hair & body",
        links: [
          { label: "Hair oil", href: browse("beauty-personal-care", "oil") },
          { label: "Soap", href: browse("beauty-personal-care", "soap") },
          { label: "Lipstick", href: browse("beauty-personal-care", "lip") },
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
          { label: "Supplements", href: browse("health-wellness", "supplement") },
          { label: "Yoga", href: browse("health-wellness", "yoga") },
          { label: "Fitness", href: browse("sports-fitness") },
        ],
      },
    ],
  },
  {
    key: "baby",
    label: "Baby & Kids",
    href: browse("baby-kids"),
    columns: [
      {
        heading: "Essentials",
        links: [
          { label: "Toys", href: browse("baby-kids", "toy") },
          { label: "Clothing", href: browse("baby-kids", "cloth") },
          { label: "Feeding", href: browse("baby-kids", "bottle") },
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
        heading: "Training",
        links: [
          { label: "Dumbbells", href: browse("sports-fitness", "dumbbell") },
          { label: "Bands", href: browse("sports-fitness", "band") },
          { label: "Mats", href: browse("health-wellness", "mat") },
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
        heading: "Desk",
        links: [
          { label: "Notebooks", href: browse("stationery-office", "notebook") },
          { label: "Pens", href: browse("stationery-office", "pen") },
          { label: "Organisers", href: browse("stationery-office", "organiser") },
        ],
      },
    ],
  },
  {
    key: "bags",
    label: "Bags",
    href: browse("bags-footwear"),
    columns: [
      {
        heading: "Carry",
        links: [
          { label: "Backpacks", href: browse("bags-footwear", "backpack") },
          { label: "Handbags", href: browse("bags-footwear", "handbag") },
          { label: "Footwear", href: browse("bags-footwear", "shoe") },
        ],
      },
    ],
  },
  {
    key: "mobile",
    label: "Mobile",
    href: browse("mobile-accessories"),
    columns: [
      {
        heading: "Phone",
        links: [
          { label: "Cases", href: browse("mobile-accessories", "case") },
          { label: "Chargers", href: browse("mobile-accessories", "charger") },
          { label: "Screen guards", href: browse("mobile-accessories", "screen") },
        ],
      },
    ],
  },
];

export const ALL_CATEGORIES_MENU: MegaMenuColumn[] = [
  {
    heading: "Shop by department",
    links: MEGA_MENU.map((entry) => ({
      label: entry.label,
      href: entry.href,
    })),
  },
  {
    heading: "More",
    links: [
      { label: "Household essentials", href: browse("household-essentials") },
      { label: "General merchandise", href: browse("general-merchandise") },
      { label: "New arrivals", href: "/browse?sort=newest" },
      { label: "Deals", href: "/browse?sort=newest" },
    ],
  },
];

export const TRENDING_SEARCHES = [
  "kurta",
  "earbuds",
  "face wash",
  "yoga mat",
  "phone case",
  "bedsheet",
];
