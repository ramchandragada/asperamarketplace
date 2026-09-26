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

function browse(
  categorySlug: string,
  opts?: { q?: string; audience?: "women" | "men" | "kids" },
) {
  const params = new URLSearchParams({ categorySlug });
  if (opts?.q) params.set("q", opts.q);
  if (opts?.audience) params.set("audience", opts.audience);
  return `/browse?${params.toString()}`;
}

function link(
  label: string,
  categorySlug: string,
  opts?: { q?: string; audience?: "women" | "men" | "kids" },
) {
  return { label, href: browse(categorySlug, opts) };
}

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
 * Aspera category navigation — dense multi-column mega-menu IA mapped to
 * seeded catalogue slugs. Structure mirrors marketplace mega-menus; labels
 * and order remain Aspera’s own.
 */
export const MEGA_MENU: MegaMenuCategory[] = [
  {
    key: "women",
    label: "Women",
    href: browse("fashion", { audience: "women" }),
    columns: [
      {
        heading: "Sarees",
        links: [
          link("All sarees", "fashion", { audience: "women", q: "saree" }),
          link("Georgette sarees", "fashion", { audience: "women", q: "georgette" }),
          link("Cotton sarees", "fashion", { audience: "women", q: "cotton saree" }),
          link("Silk sarees", "fashion", { audience: "women", q: "silk saree" }),
          link("Party sarees", "fashion", { audience: "women", q: "party saree" }),
          link("Bridal sarees", "fashion", { audience: "women", q: "bridal" }),
        ],
      },
      {
        heading: "Kurtis",
        links: [
          link("All kurtis", "fashion", { audience: "women", q: "kurti" }),
          link("Anarkali kurtis", "fashion", { audience: "women", q: "anarkali" }),
          link("Cotton kurtis", "fashion", { audience: "women", q: "cotton kurti" }),
          link("Straight kurtis", "fashion", { audience: "women", q: "straight kurti" }),
          link("Long kurtis", "fashion", { audience: "women", q: "long kurti" }),
          link("Printed kurtis", "fashion", { audience: "women", q: "printed kurti" }),
        ],
      },
      {
        heading: "Kurta sets",
        links: [
          link("All kurta sets", "fashion", { audience: "women", q: "kurta set" }),
          link("Kurta palazzo sets", "fashion", { audience: "women", q: "palazzo" }),
          link("Kurta pant sets", "fashion", { audience: "women", q: "kurta pant" }),
          link("Sharara sets", "fashion", { audience: "women", q: "sharara" }),
          link("Anarkali sets", "fashion", { audience: "women", q: "anarkali set" }),
          link("Cotton sets", "fashion", { audience: "women", q: "cotton set" }),
        ],
      },
      {
        heading: "Lehengas & gowns",
        links: [
          link("All lehengas", "fashion", { audience: "women", q: "lehenga" }),
          link("Bridal lehengas", "fashion", { audience: "women", q: "bridal lehenga" }),
          link("Party lehengas", "fashion", { audience: "women", q: "party lehenga" }),
          link("Gowns", "fashion", { audience: "women", q: "gown" }),
          link("Trending gowns", "fashion", { audience: "women", q: "evening gown" }),
        ],
      },
      {
        heading: "Suits & dress material",
        links: [
          link("All dress materials", "fashion", { audience: "women", q: "dress material" }),
          link("Cotton suits", "fashion", { audience: "women", q: "cotton suit" }),
          link("Party wear suits", "fashion", { audience: "women", q: "party suit" }),
          link("Salwar suits", "fashion", { audience: "women", q: "salwar" }),
          link("Patiala sets", "fashion", { audience: "women", q: "patiala" }),
        ],
      },
      {
        heading: "Blouses & dupattas",
        links: [
          link("All blouses", "fashion", { audience: "women", q: "blouse" }),
          link("Designer blouses", "fashion", { audience: "women", q: "designer blouse" }),
          link("Dupattas", "fashion", { audience: "women", q: "dupatta" }),
          link("Dupatta sets", "fashion", { audience: "women", q: "dupatta set" }),
          link("Blouse pieces", "fashion", { audience: "women", q: "blouse piece" }),
        ],
      },
      {
        heading: "Western wear",
        links: [
          link("Dresses", "fashion", { audience: "women", q: "dress" }),
          link("Tops", "fashion", { audience: "women", q: "top" }),
          link("Jeans", "fashion", { audience: "women", q: "jeans" }),
          link("Trousers", "fashion", { audience: "women", q: "trouser" }),
          link("Skirts", "fashion", { audience: "women", q: "skirt" }),
          link("Jumpsuits", "fashion", { audience: "women", q: "jumpsuit" }),
        ],
      },
      {
        heading: "Lingerie & sleep",
        links: [
          link("Bras", "fashion", { audience: "women", q: "bra" }),
          link("Lingerie sets", "fashion", { audience: "women", q: "lingerie" }),
          link("Nightwear", "fashion", { audience: "women", q: "nightwear" }),
          link("Shapewear", "fashion", { audience: "women", q: "shapewear" }),
        ],
      },
      {
        heading: "More for women",
        links: [
          link("Ethnic bottoms", "fashion", { audience: "women", q: "ethnic bottom" }),
          link("Jackets & shrugs", "fashion", { audience: "women", q: "shrug" }),
          {
            label: "Under ₹599",
            href: "/browse?categorySlug=fashion&audience=women&maxPricePaise=59900",
          },
          { label: "New in fashion", href: "/shop?categorySlug=fashion&audience=women&sort=newest" },
          { label: "Shop all women", href: browse("fashion", { audience: "women" }) },
        ],
      },
    ],
  },
  {
    key: "men",
    label: "Men",
    href: browse("fashion", { audience: "men" }),
    columns: [
      {
        heading: "Topwear",
        links: [
          link("All shirts", "fashion", { audience: "men", q: "shirt" }),
          link("Casual shirts", "fashion", { audience: "men", q: "casual shirt" }),
          link("Formal shirts", "fashion", { audience: "men", q: "formal shirt" }),
          link("T-shirts", "fashion", { audience: "men", q: "tee" }),
          link("Polos", "fashion", { audience: "men", q: "polo" }),
          link("Hoodies", "fashion", { audience: "men", q: "hoodie" }),
        ],
      },
      {
        heading: "Bottomwear",
        links: [
          link("Jeans", "fashion", { audience: "men", q: "jeans" }),
          link("Trousers", "fashion", { audience: "men", q: "trouser" }),
          link("Chinos", "fashion", { audience: "men", q: "chino" }),
          link("Shorts", "fashion", { audience: "men", q: "shorts" }),
          link("Track pants", "fashion", { audience: "men", q: "track" }),
        ],
      },
      {
        heading: "Ethnic wear",
        links: [
          link("Kurtas", "fashion", { audience: "men", q: "kurta" }),
          link("Kurta sets", "fashion", { audience: "men", q: "kurta set" }),
          link("Sherwanis", "fashion", { audience: "men", q: "sherwani" }),
          link("Nehru jackets", "fashion", { audience: "men", q: "nehru" }),
        ],
      },
      {
        heading: "Innerwear & sleep",
        links: [
          link("Innerwear", "fashion", { audience: "men", q: "innerwear" }),
          link("Vests", "fashion", { audience: "men", q: "vest" }),
          link("Nightwear", "fashion", { audience: "men", q: "nightwear" }),
        ],
      },
      {
        heading: "Accessories",
        links: [
          link("Watches", "electronics-accessories", { q: "watch" }),
          link("Belts", "fashion", { audience: "men", q: "belt" }),
          link("Wallets", "bags-footwear", { q: "wallet" }),
          link("Caps", "fashion", { audience: "men", q: "cap" }),
        ],
      },
      {
        heading: "Bags & footwear",
        links: [
          link("Casual shoes", "bags-footwear", { q: "casual shoe" }),
          link("Formal shoes", "bags-footwear", { q: "formal shoe" }),
          link("Sneakers", "bags-footwear", { q: "sneaker" }),
          link("Backpacks", "bags-footwear", { q: "backpack" }),
        ],
      },
      {
        heading: "More for men",
        links: [
          link("Jackets", "fashion", { audience: "men", q: "jacket" }),
          link("Blazers", "fashion", { audience: "men", q: "blazer" }),
          { label: "New arrivals", href: "/shop?categorySlug=fashion&audience=men&sort=newest" },
          { label: "Shop all men", href: browse("fashion", { audience: "men" }) },
        ],
      },
    ],
  },
  {
    key: "kids",
    label: "Kids",
    href: browse("baby-kids", { audience: "kids" }),
    columns: [
      {
        heading: "Boys clothing",
        links: [
          link("T-shirts", "baby-kids", { audience: "kids", q: "boys tee" }),
          link("Shirts", "baby-kids", { audience: "kids", q: "boys shirt" }),
          link("Jeans", "baby-kids", { audience: "kids", q: "boys jeans" }),
          link("Shorts", "baby-kids", { audience: "kids", q: "boys shorts" }),
          link("Ethnic wear", "baby-kids", { audience: "kids", q: "boys ethnic" }),
        ],
      },
      {
        heading: "Girls clothing",
        links: [
          link("Dresses", "baby-kids", { audience: "kids", q: "girls dress" }),
          link("Tops", "baby-kids", { audience: "kids", q: "girls top" }),
          link("Skirts", "baby-kids", { audience: "kids", q: "girls skirt" }),
          link("Ethnic wear", "baby-kids", { audience: "kids", q: "girls ethnic" }),
          link("Leggings", "baby-kids", { audience: "kids", q: "leggings" }),
        ],
      },
      {
        heading: "Baby essentials",
        links: [
          link("Onesies", "baby-kids", { audience: "kids", q: "onesie" }),
          link("Rompers", "baby-kids", { audience: "kids", q: "romper" }),
          link("Blankets", "baby-kids", { audience: "kids", q: "blanket" }),
          link("Feeding", "baby-kids", { audience: "kids", q: "feeding" }),
        ],
      },
      {
        heading: "Toys & play",
        links: [
          link("Soft toys", "baby-kids", { audience: "kids", q: "soft toy" }),
          link("Educational toys", "baby-kids", { audience: "kids", q: "educational" }),
          link("Outdoor toys", "baby-kids", { audience: "kids", q: "outdoor toy" }),
          link("Board games", "baby-kids", { audience: "kids", q: "game" }),
        ],
      },
      {
        heading: "Footwear & bags",
        links: [
          link("School shoes", "bags-footwear", { q: "school shoe" }),
          link("Sandals", "bags-footwear", { q: "kids sandal" }),
          link("School bags", "bags-footwear", { q: "school bag" }),
        ],
      },
      {
        heading: "More for kids",
        links: [
          link("Hoodies", "baby-kids", { audience: "kids", q: "hoodie" }),
          link("Care essentials", "baby-kids", { audience: "kids" }),
          { label: "Shop all kids", href: browse("baby-kids", { audience: "kids" }) },
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
          link("Face wash", "beauty-personal-care", { q: "face wash" }),
          link("Moisturisers", "beauty-personal-care", { q: "moisturiser" }),
          link("Serums", "beauty-personal-care", { q: "serum" }),
          link("Sunscreen", "beauty-personal-care", { q: "sunscreen" }),
          link("Face packs", "beauty-personal-care", { q: "face pack" }),
        ],
      },
      {
        heading: "Makeup",
        links: [
          link("Lipstick", "beauty-personal-care", { q: "lipstick" }),
          link("Kajal & eyeliner", "beauty-personal-care", { q: "kajal" }),
          link("Foundation", "beauty-personal-care", { q: "foundation" }),
          link("Nail polish", "beauty-personal-care", { q: "nail" }),
          link("Compact", "beauty-personal-care", { q: "compact" }),
        ],
      },
      {
        heading: "Haircare",
        links: [
          link("Shampoo", "beauty-personal-care", { q: "shampoo" }),
          link("Hair oil", "beauty-personal-care", { q: "hair oil" }),
          link("Conditioner", "beauty-personal-care", { q: "conditioner" }),
          link("Hair colour", "beauty-personal-care", { q: "hair colour" }),
        ],
      },
      {
        heading: "Bath & body",
        links: [
          link("Soaps", "beauty-personal-care", { q: "soap" }),
          link("Body lotion", "beauty-personal-care", { q: "lotion" }),
          link("Deodorants", "beauty-personal-care", { q: "deodorant" }),
          link("Hand wash", "beauty-personal-care", { q: "hand wash" }),
        ],
      },
      {
        heading: "Men’s grooming",
        links: [
          link("Beard care", "beauty-personal-care", { q: "beard" }),
          link("Shaving", "beauty-personal-care", { q: "shave" }),
          link("Face wash for men", "beauty-personal-care", { q: "men face" }),
        ],
      },
      {
        heading: "More beauty",
        links: [
          link("Fragrance", "beauty-personal-care", { q: "perfume" }),
          link("Tools & brushes", "beauty-personal-care", { q: "brush" }),
          { label: "Shop all beauty", href: browse("beauty-personal-care") },
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
        heading: "Kitchen",
        links: [
          link("Cookware", "home-kitchen", { q: "cookware" }),
          link("Dinnerware", "home-kitchen", { q: "dinnerware" }),
          link("Storage jars", "home-kitchen", { q: "storage" }),
          link("Kitchen tools", "home-kitchen", { q: "kitchen tool" }),
          link("Appliances", "home-kitchen", { q: "appliance" }),
        ],
      },
      {
        heading: "Home decor",
        links: [
          link("Wall art", "home-kitchen", { q: "wall" }),
          link("Clocks", "home-kitchen", { q: "clock" }),
          link("Showpieces", "home-kitchen", { q: "showpiece" }),
          link("Candles", "home-kitchen", { q: "candle" }),
          link("Photo frames", "home-kitchen", { q: "frame" }),
        ],
      },
      {
        heading: "Bedding",
        links: [
          link("Bedsheets", "home-kitchen", { q: "bedsheet" }),
          link("Pillows", "home-kitchen", { q: "pillow" }),
          link("Blankets", "home-kitchen", { q: "blanket" }),
          link("Curtains", "home-kitchen", { q: "curtain" }),
        ],
      },
      {
        heading: "Bath",
        links: [
          link("Towels", "home-kitchen", { q: "towel" }),
          link("Bath mats", "home-kitchen", { q: "bath mat" }),
          link("Bathroom accessories", "home-kitchen", { q: "bathroom" }),
        ],
      },
      {
        heading: "Storage & organisation",
        links: [
          link("Organisers", "home-kitchen", { q: "organiser" }),
          link("Laundry", "home-kitchen", { q: "laundry" }),
          link("Hooks & hangers", "home-kitchen", { q: "hanger" }),
        ],
      },
      {
        heading: "Household",
        links: [
          link("Cleaning", "household-essentials", { q: "clean" }),
          link("Essentials", "household-essentials"),
          { label: "Shop all home", href: browse("home-kitchen") },
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
          link("Earphones", "electronics-accessories", { q: "earphone" }),
          link("Headphones", "electronics-accessories", { q: "headphone" }),
          link("Bluetooth speakers", "electronics-accessories", { q: "speaker" }),
          link("Earbuds", "electronics-accessories", { q: "earbud" }),
        ],
      },
      {
        heading: "Mobile accessories",
        links: [
          link("Cases & covers", "mobile-accessories", { q: "case" }),
          link("Chargers", "mobile-accessories", { q: "charger" }),
          link("Power banks", "mobile-accessories", { q: "power bank" }),
          link("Screen guards", "mobile-accessories", { q: "screen" }),
          link("Cables", "mobile-accessories", { q: "cable" }),
        ],
      },
      {
        heading: "Wearables",
        links: [
          link("Smartwatches", "electronics-accessories", { q: "smartwatch" }),
          link("Fitness bands", "electronics-accessories", { q: "fitness band" }),
          link("Classic watches", "electronics-accessories", { q: "watch" }),
        ],
      },
      {
        heading: "Computer & peripherals",
        links: [
          link("Keyboards", "electronics-accessories", { q: "keyboard" }),
          link("Mouse", "electronics-accessories", { q: "mouse" }),
          link("USB hubs", "electronics-accessories", { q: "usb" }),
        ],
      },
      {
        heading: "More gadgets",
        links: [
          link("Cameras", "electronics-accessories", { q: "camera" }),
          link("Smart home", "electronics-accessories", { q: "smart" }),
          { label: "Shop all electronics", href: browse("electronics-accessories") },
        ],
      },
    ],
  },
  {
    key: "footwear",
    label: "Footwear",
    href: browse("bags-footwear", { q: "shoe" }),
    columns: [
      {
        heading: "Women’s footwear",
        links: [
          link("Flats", "bags-footwear", { q: "flat" }),
          link("Heels", "bags-footwear", { q: "heel" }),
          link("Sandals", "bags-footwear", { q: "sandal" }),
          link("Sneakers", "bags-footwear", { q: "women sneaker" }),
          link("Ethnic footwear", "bags-footwear", { q: "jutti" }),
        ],
      },
      {
        heading: "Men’s footwear",
        links: [
          link("Casual shoes", "bags-footwear", { q: "casual shoe" }),
          link("Formal shoes", "bags-footwear", { q: "formal shoe" }),
          link("Sneakers", "bags-footwear", { q: "sneaker" }),
          link("Sandals", "bags-footwear", { q: "men sandal" }),
          link("Sports shoes", "bags-footwear", { q: "sports shoe" }),
        ],
      },
      {
        heading: "Kids’ footwear",
        links: [
          link("School shoes", "bags-footwear", { q: "school shoe" }),
          link("Sandals", "bags-footwear", { q: "kids sandal" }),
          link("Sneakers", "bags-footwear", { q: "kids sneaker" }),
        ],
      },
      {
        heading: "More footwear",
        links: [
          link("Slippers", "bags-footwear", { q: "slipper" }),
          link("Boots", "bags-footwear", { q: "boot" }),
          { label: "Shop all footwear", href: browse("bags-footwear", { q: "shoe" }) },
        ],
      },
    ],
  },
  {
    key: "bags",
    label: "Bags",
    href: browse("bags-footwear", { q: "bag" }),
    columns: [
      {
        heading: "Handbags",
        links: [
          link("All handbags", "bags-footwear", { q: "handbag" }),
          link("Tote bags", "bags-footwear", { q: "tote" }),
          link("Sling bags", "bags-footwear", { q: "sling" }),
          link("Clutches", "bags-footwear", { q: "clutch" }),
        ],
      },
      {
        heading: "Backpacks",
        links: [
          link("All backpacks", "bags-footwear", { q: "backpack" }),
          link("Laptop bags", "bags-footwear", { q: "laptop bag" }),
          link("School bags", "bags-footwear", { q: "school bag" }),
        ],
      },
      {
        heading: "Travel",
        links: [
          link("Duffel bags", "bags-footwear", { q: "duffel" }),
          link("Travel kits", "bags-footwear", { q: "travel" }),
          link("Luggage", "bags-footwear", { q: "luggage" }),
        ],
      },
      {
        heading: "Wallets & more",
        links: [
          link("Wallets", "bags-footwear", { q: "wallet" }),
          link("Pouches", "bags-footwear", { q: "pouch" }),
          { label: "Shop all bags", href: browse("bags-footwear", { q: "bag" }) },
        ],
      },
    ],
  },
  {
    key: "jewellery",
    label: "Jewellery",
    href: browse("fashion", { audience: "women", q: "jewellery" }),
    columns: [
      {
        heading: "Earrings",
        links: [
          link("All earrings", "fashion", { audience: "women", q: "earring" }),
          link("Studs", "fashion", { audience: "women", q: "stud" }),
          link("Jhumkas", "fashion", { audience: "women", q: "jhumka" }),
          link("Drops", "fashion", { audience: "women", q: "drop earring" }),
        ],
      },
      {
        heading: "Necklaces",
        links: [
          link("All necklaces", "fashion", { audience: "women", q: "necklace" }),
          link("Pendants", "fashion", { audience: "women", q: "pendant" }),
          link("Chains", "fashion", { audience: "women", q: "chain" }),
          link("Chokers", "fashion", { audience: "women", q: "choker" }),
        ],
      },
      {
        heading: "Bangles & bracelets",
        links: [
          link("Bangles", "fashion", { audience: "women", q: "bangle" }),
          link("Bracelets", "fashion", { audience: "women", q: "bracelet" }),
          link("Kadas", "fashion", { audience: "women", q: "kada" }),
        ],
      },
      {
        heading: "Rings & more",
        links: [
          link("Rings", "fashion", { audience: "women", q: "ring" }),
          link("Anklets", "fashion", { audience: "women", q: "anklet" }),
          link("Jewellery sets", "fashion", { audience: "women", q: "jewellery set" }),
          { label: "Shop all jewellery", href: browse("fashion", { audience: "women", q: "jewellery" }) },
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
        heading: "Pantry",
        links: [
          link("Staples", "household-essentials", { q: "staple" }),
          link("Snacks", "household-essentials", { q: "snack" }),
          link("Beverages", "household-essentials", { q: "beverage" }),
          link("Spices", "household-essentials", { q: "spice" }),
        ],
      },
      {
        heading: "Cleaning",
        links: [
          link("Floor cleaners", "household-essentials", { q: "floor" }),
          link("Detergents", "household-essentials", { q: "detergent" }),
          link("Dishwash", "household-essentials", { q: "dish" }),
        ],
      },
      {
        heading: "Home care",
        links: [
          link("Tissue & paper", "household-essentials", { q: "tissue" }),
          link("Freshners", "household-essentials", { q: "freshner" }),
          { label: "Shop all grocery", href: browse("household-essentials") },
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
        heading: "Fitness gear",
        links: [
          link("Dumbbells", "sports-fitness", { q: "dumbbell" }),
          link("Resistance bands", "sports-fitness", { q: "resistance" }),
          link("Yoga mats", "sports-fitness", { q: "yoga" }),
          link("Skipping ropes", "sports-fitness", { q: "skipping" }),
        ],
      },
      {
        heading: "Sports equipment",
        links: [
          link("Cricket", "sports-fitness", { q: "cricket" }),
          link("Badminton", "sports-fitness", { q: "badminton" }),
          link("Football", "sports-fitness", { q: "football" }),
        ],
      },
      {
        heading: "Activewear",
        links: [
          link("Tracksuits", "sports-fitness", { q: "tracksuit" }),
          link("Sports tees", "sports-fitness", { q: "sports tee" }),
          { label: "Shop all sports", href: browse("sports-fitness") },
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
        heading: "Supplements",
        links: [
          link("Vitamins", "health-wellness", { q: "vitamin" }),
          link("Protein", "health-wellness", { q: "protein" }),
          link("Immunity", "health-wellness", { q: "immunity" }),
        ],
      },
      {
        heading: "Personal care",
        links: [
          link("Oral care", "health-wellness", { q: "oral" }),
          link("Sanitisers", "health-wellness", { q: "sanitiser" }),
          link("Masks", "health-wellness", { q: "mask" }),
        ],
      },
      {
        heading: "Wellness",
        links: [
          link("Ayurveda", "health-wellness", { q: "ayurveda" }),
          link("First aid", "health-wellness", { q: "first aid" }),
          { label: "Shop all health", href: browse("health-wellness") },
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
        heading: "Writing",
        links: [
          link("Pens", "stationery-office", { q: "pen" }),
          link("Pencils", "stationery-office", { q: "pencil" }),
          link("Markers", "stationery-office", { q: "marker" }),
        ],
      },
      {
        heading: "Notebooks",
        links: [
          link("Notebooks", "stationery-office", { q: "note" }),
          link("Diaries", "stationery-office", { q: "diary" }),
          link("Notepads", "stationery-office", { q: "notepad" }),
        ],
      },
      {
        heading: "Desk essentials",
        links: [
          link("Files & folders", "stationery-office", { q: "folder" }),
          link("Staplers", "stationery-office", { q: "stapler" }),
          { label: "Shop all stationery", href: browse("stationery-office") },
        ],
      },
    ],
  },
  {
    key: "automotive",
    label: "Automotive",
    href: browse("electronics-accessories", { q: "car" }),
    columns: [
      {
        heading: "Car accessories",
        links: [
          link("Car covers", "electronics-accessories", { q: "car cover" }),
          link("Phone mounts", "electronics-accessories", { q: "car mount" }),
          link("Chargers", "electronics-accessories", { q: "car charger" }),
        ],
      },
      {
        heading: "Bike accessories",
        links: [
          link("Helmets", "electronics-accessories", { q: "helmet" }),
          link("Bike covers", "electronics-accessories", { q: "bike cover" }),
          { label: "Shop automotive", href: browse("electronics-accessories", { q: "car" }) },
        ],
      },
    ],
  },
  {
    key: "pet-supplies",
    label: "Pet Supplies",
    href: browse("household-essentials", { q: "pet" }),
    columns: [
      {
        heading: "Pet care",
        links: [
          link("Pet food", "household-essentials", { q: "pet food" }),
          link("Toys", "household-essentials", { q: "pet toy" }),
          link("Grooming", "household-essentials", { q: "pet groom" }),
          link("Beds & bowls", "household-essentials", { q: "pet bed" }),
          { label: "Shop pet supplies", href: browse("household-essentials", { q: "pet" }) },
        ],
      },
    ],
  },
];

/** Homepage shop-by-category tiles — eight primary lanes with imagery. */
export const ASPERA_CATEGORY_TILES = [
  {
    id: "women",
    label: "Women",
    href: browse("fashion", { audience: "women" }),
    imageUrl:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "men",
    label: "Men",
    href: browse("fashion", { audience: "men" }),
    imageUrl:
      "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "kids",
    label: "Kids",
    href: browse("baby-kids", { audience: "kids" }),
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
    href: browse("bags-footwear", { q: "shoe" }),
    imageUrl:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "bags",
    label: "Bags",
    href: browse("bags-footwear", { q: "bag" }),
    imageUrl:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80",
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
