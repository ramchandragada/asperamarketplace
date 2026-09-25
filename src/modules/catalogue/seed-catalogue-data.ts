/**
 * Development/preview catalogue definitions only.
 * Fictional products for visual credibility — not production inventory.
 */

export type SeedCategoryDef = {
  slug: string;
  name: string;
  description: string;
  imagePool: string[];
};

export type SeedProductDef = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  categorySlug: string;
  brandSlug: string;
  sellerKey: "home" | "fashion" | "tech" | "wellness";
  sku: string;
  mrpPaise: number;
  sellingPricePaise: number;
  onHand: number;
  weightGrams: number;
  hsnCode: string;
  status?: "approved" | "draft" | "submitted";
};

/** Curated Unsplash photo IDs (development/preview imagery only). */
const U = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

export const SEED_CATEGORIES: SeedCategoryDef[] = [
  {
    slug: "general-merchandise",
    name: "General merchandise",
    description: "Everyday essentials and mixed household finds.",
    imagePool: [
      U("photo-1586075010923-2dd4570fb338"),
      U("photo-1556911220-bff31c812dba"),
      U("photo-1484154218962-a197022b5858"),
    ],
  },
  {
    slug: "fashion",
    name: "Fashion",
    description: "Apparel and everyday style for Indian weather.",
    imagePool: [
      U("photo-1483985988355-763728e1935b"),
      U("photo-1490481651871-ab68de25d43d"),
      U("photo-1445205170230-053b83016050"),
    ],
  },
  {
    slug: "beauty-personal-care",
    name: "Beauty & personal care",
    description: "Skincare, haircare, and grooming essentials.",
    imagePool: [
      U("photo-1596462502278-27bfdc403348"),
      U("photo-1571781926291-c77df89afad5"),
      U("photo-1522335789203-aabd1fc54bc9"),
    ],
  },
  {
    slug: "home-kitchen",
    name: "Home & kitchen",
    description: "Cookware, storage, and living-space upgrades.",
    imagePool: [
      U("photo-1556911220-e15b29be8c8f"),
      U("photo-1556909114-f6e7ad7d3136"),
      U("photo-1586023492125-27b2c045efd7"),
    ],
  },
  {
    slug: "electronics-accessories",
    name: "Electronics & accessories",
    description: "Cables, audio, and desk gadgets.",
    imagePool: [
      U("photo-1505740420928-5e560c06d30e"),
      U("photo-1572569511254-d8f925fe2cbb"),
      U("photo-1484704849700-f032a568e944"),
    ],
  },
  {
    slug: "mobile-accessories",
    name: "Mobile accessories",
    description: "Cases, chargers, and phone add-ons.",
    imagePool: [
      U("photo-1511707171634-5f897ff02aa9"),
      U("photo-1580910051074-3eb694886505"),
      U("photo-1601784551446-20c9e07cdbdb"),
    ],
  },
  {
    slug: "health-wellness",
    name: "Health & wellness",
    description: "Fitness and everyday wellness products.",
    imagePool: [
      U("photo-1517836357463-d25dfeac3438"),
      U("photo-1571019614242-c5c5dee9f50b"),
      U("photo-1544367567-0f2fcb009e0b"),
    ],
  },
  {
    slug: "baby-kids",
    name: "Baby & kids",
    description: "Soft goods and essentials for little ones.",
    imagePool: [
      U("photo-1515488042361-ee00e0ddd4e4"),
      U("photo-1503454537195-1dcabb73ffb9"),
      U("photo-1566459967917-75f63c8d0b7b"),
    ],
  },
  {
    slug: "stationery-office",
    name: "Stationery & office",
    description: "Notebooks, organisers, and desk tools.",
    imagePool: [
      U("photo-1452860606245-08befc0ff44b"),
      U("photo-1517842645767-c639042777db"),
      U("photo-1586281380349-632531db7ed4"),
    ],
  },
  {
    slug: "sports-fitness",
    name: "Sports & fitness",
    description: "Training gear for home and outdoor workouts.",
    imagePool: [
      U("photo-1517963879433-6ad2b056d944"),
      U("photo-1576678927484-cc907957088c"),
      U("photo-1534438327276-14e5300c3a48"),
    ],
  },
  {
    slug: "bags-footwear",
    name: "Bags & footwear",
    description: "Everyday bags, sandals, and sneakers.",
    imagePool: [
      U("photo-1549298916-b41d501d3772"),
      U("photo-1548036328-c9fa89d128fa"),
      U("photo-1560343090-f0409e92791a"),
    ],
  },
  {
    slug: "household-essentials",
    name: "Household essentials",
    description: "Cleaning and utility staples for Indian homes.",
    imagePool: [
      U("photo-1581578731548-c64695cc6952"),
      U("photo-1563453392212-326f5e854473"),
      U("photo-1558618666-fcd25c85cd64"),
    ],
  },
];

export const SEED_BRANDS = [
  { slug: "aspera-home", name: "Aspera Home" },
  { slug: "narmada-weave", name: "Narmada Weave" },
  { slug: "coastal-bloom", name: "Coastal Bloom" },
  { slug: "silicon-bay", name: "Silicon Bay" },
  { slug: "pulse-fit", name: "Pulse Fit" },
  { slug: "little-lotus", name: "Little Lotus" },
  { slug: "ink-and-quill", name: "Ink & Quill" },
  { slug: "trailmark", name: "Trailmark" },
] as const;

function productsFor(
  categorySlug: string,
  items: Array<Omit<SeedProductDef, "categorySlug">>,
): SeedProductDef[] {
  return items.map((item) => ({ ...item, categorySlug }));
}

/** At least 10 products per category; mix of prices, stock, and a few non-approved. */
export const SEED_PRODUCTS: SeedProductDef[] = [
  ...productsFor("general-merchandise", [
    { slug: "cotton-tea-towel-set-demo", title: "Cotton tea towel set", summary: "Pack of three absorbent cotton tea towels for everyday kitchens.", description: "Fictional development listing. Soft cotton towels with hanging loops for drying crockery and wiping counters.", brandSlug: "aspera-home", sellerKey: "home", sku: "TOWEL-SET-01", mrpPaise: 59900, sellingPricePaise: 39900, onHand: 40, weightGrams: 350, hsnCode: "6302" },
    { slug: "bamboo-laundry-basket", title: "Bamboo laundry basket", summary: "Ventilated bamboo hamper with cotton liner.", description: "Lightweight rectangular basket for bedrooms and balconies. Removable washable liner. Development seed listing only.", brandSlug: "aspera-home", sellerKey: "home", sku: "BAM-LB-01", mrpPaise: 189900, sellingPricePaise: 149900, onHand: 18, weightGrams: 2200, hsnCode: "4602" },
    { slug: "microfibre-cleaning-cloth-pack", title: "Microfibre cleaning cloth pack", summary: "Set of eight colour-coded microfibre cloths.", description: "Lint-free cloths for glass, kitchen, and electronics. Seed catalogue item for browse density.", brandSlug: "aspera-home", sellerKey: "home", sku: "MF-CL-08", mrpPaise: 49900, sellingPricePaise: 34900, onHand: 120, weightGrams: 280, hsnCode: "6307" },
    { slug: "foldable-shopping-tote", title: "Foldable shopping tote", summary: "Compact nylon tote that packs into a pouch.", description: "Reusable market bag with reinforced handles. Ideal cart-test accessory in development.", brandSlug: "narmada-weave", sellerKey: "fashion", sku: "TOTE-FLD-01", mrpPaise: 39900, sellingPricePaise: 29900, onHand: 75, weightGrams: 120, hsnCode: "4202" },
    { slug: "silicone-ice-tray-with-lid", title: "Silicone ice tray with lid", summary: "Flexible tray for slow-melt cubes with spill-proof lid.", description: "Freezer-safe silicone. Lid reduces odour transfer. Fictional seed product.", brandSlug: "aspera-home", sellerKey: "home", sku: "ICE-SL-01", mrpPaise: 44900, sellingPricePaise: 44900, onHand: 55, weightGrams: 220, hsnCode: "3924" },
    { slug: "cotton-floor-duster", title: "Cotton floor duster", summary: "Traditional cotton thread mop head with wooden handle.", description: "Replacement-ready mop for tile floors. Seed listing for household cross-sell.", brandSlug: "aspera-home", sellerKey: "home", sku: "DST-CT-01", mrpPaise: 34900, sellingPricePaise: 24900, onHand: 3, weightGrams: 900, hsnCode: "9603" },
    { slug: "steel-peg-hanger-pack", title: "Steel peg hanger pack", summary: "Pack of twenty rust-resistant clothes pegs.", description: "Spring pegs for balcony drying lines. Development catalogue filler with realistic pricing.", brandSlug: "aspera-home", sellerKey: "home", sku: "PEG-ST-20", mrpPaise: 19900, sellingPricePaise: 14900, onHand: 200, weightGrams: 320, hsnCode: "7326" },
    { slug: "scented-soy-votive-trio", title: "Scented soy votive trio", summary: "Three soy wax votives in sandalwood, citrus, and jasmine.", description: "Small burn-time candles for shelves and bathrooms. Seed imagery only—not a fragrance claim.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "VOTE-3", mrpPaise: 69900, sellingPricePaise: 54900, onHand: 40, weightGrams: 450, hsnCode: "3406" },
    { slug: "reusable-produce-mesh-bags", title: "Reusable produce mesh bags", summary: "Set of five washable mesh bags for fruits and vegetables.", description: "Lightweight bags with drawcords. Useful for filter and cart tests.", brandSlug: "narmada-weave", sellerKey: "home", sku: "MESH-5", mrpPaise: 59900, sellingPricePaise: 39900, onHand: 0, weightGrams: 150, hsnCode: "6307" },
    { slug: "digital-kitchen-timer", title: "Digital kitchen timer", summary: "Magnetic countdown timer with loud alert.", description: "Simple LCD timer for cooking sessions. Fictional seed SKU.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "TMR-DIG-01", mrpPaise: 49900, sellingPricePaise: 37900, onHand: 60, weightGrams: 90, hsnCode: "9106" },
    { slug: "general-merch-draft-organiser", title: "Draft desk caddy (unpublished)", summary: "Draft listing used to test seller moderation queues.", description: "Not visible on the public storefront. Seed draft status only.", brandSlug: "ink-and-quill", sellerKey: "home", sku: "DRF-CAD-01", mrpPaise: 79900, sellingPricePaise: 59900, onHand: 10, weightGrams: 400, hsnCode: "3926", status: "draft" },
  ]),
  ...productsFor("fashion", [
    { slug: "handloom-cotton-kurta", title: "Handloom cotton kurta", summary: "Breathable mid-length kurta with side slits.", description: "Soft handloom cotton suitable for warm weather. Demo fashion listing for Aspera storefront.", brandSlug: "narmada-weave", sellerKey: "fashion", sku: "KUR-HL-M", mrpPaise: 189900, sellingPricePaise: 149900, onHand: 28, weightGrams: 320, hsnCode: "6205" },
    { slug: "linen-blend-shirt", title: "Linen-blend casual shirt", summary: "Relaxed fit shirt with coconut buttons.", description: "Easy-iron linen blend for office Fridays. Seed catalogue apparel.", brandSlug: "narmada-weave", sellerKey: "fashion", sku: "SHT-LN-01", mrpPaise: 219900, sellingPricePaise: 179900, onHand: 22, weightGrams: 280, hsnCode: "6205" },
    { slug: "everyday-cotton-tee-pack", title: "Everyday cotton tee pack", summary: "Pack of three solid crew-neck tees.", description: "Mid-weight jersey tees. Development seed for multi-quantity cart tests.", brandSlug: "narmada-weave", sellerKey: "fashion", sku: "TEE-3PK", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 80, weightGrams: 450, hsnCode: "6109" },
    { slug: "block-print-dupatta", title: "Block-print cotton dupatta", summary: "Lightweight dupatta with vegetable-dye motifs.", description: "Pair with kurtas or dresses. Fictional artisan-inspired listing.", brandSlug: "narmada-weave", sellerKey: "fashion", sku: "DUP-BP-01", mrpPaise: 89900, sellingPricePaise: 69900, onHand: 35, weightGrams: 180, hsnCode: "6214" },
    { slug: "stretch-denim-jegging", title: "Stretch denim jegging", summary: "High-rise jegging with soft stretch denim.", description: "Machine-washable everyday bottomwear. Seed fashion SKU.", brandSlug: "narmada-weave", sellerKey: "fashion", sku: "JEG-STR-01", mrpPaise: 159900, sellingPricePaise: 129900, onHand: 40, weightGrams: 420, hsnCode: "6204" },
    { slug: "embroidered-cotton-palazzo", title: "Embroidered cotton palazzo", summary: "Flared palazzo with ankle embroidery.", description: "Comfortable cotton for festive casual wear. Demo listing only.", brandSlug: "narmada-weave", sellerKey: "fashion", sku: "PAL-EMB-01", mrpPaise: 149900, sellingPricePaise: 119900, onHand: 26, weightGrams: 380, hsnCode: "6204" },
    { slug: "wool-blend-scarf", title: "Wool-blend winter scarf", summary: "Soft scarf for cool evenings and AC offices.", description: "Neutral tones that layer easily. Seed product for seasonal rails.", brandSlug: "narmada-weave", sellerKey: "fashion", sku: "SCF-WL-01", mrpPaise: 99900, sellingPricePaise: 79900, onHand: 50, weightGrams: 210, hsnCode: "6117" },
    { slug: "cotton-pyjama-set", title: "Cotton pyjama set", summary: "Breathable nightwear set with piping detail.", description: "Top and pant set in soft cotton. Development seed apparel.", brandSlug: "narmada-weave", sellerKey: "fashion", sku: "PYJ-CT-01", mrpPaise: 139900, sellingPricePaise: 109900, onHand: 2, weightGrams: 400, hsnCode: "6108" },
    { slug: "rayon-wrap-dress", title: "Rayon wrap dress", summary: "Midi wrap dress with tie waist.", description: "Travel-friendly rayon. Fictional listing for PDP gallery tests.", brandSlug: "narmada-weave", sellerKey: "fashion", sku: "DRS-WR-01", mrpPaise: 249900, sellingPricePaise: 199900, onHand: 16, weightGrams: 360, hsnCode: "6204" },
    { slug: "kids-printed-hoodie", title: "Kids printed hoodie", summary: "Soft fleece hoodie with kangaroo pocket.", description: "Unisex kids fit. Seed item also useful in baby/kids cross-nav tests.", brandSlug: "little-lotus", sellerKey: "fashion", sku: "HD-KD-01", mrpPaise: 119900, sellingPricePaise: 89900, onHand: 45, weightGrams: 340, hsnCode: "6110" },
  ]),
  ...productsFor("beauty-personal-care", [
    { slug: "herbal-face-wash-oily-skin", title: "Herbal face wash for oily skin", summary: "Gel cleanser with neem and tea tree extracts.", description: "Daily face wash for oily and combination skin. Seed beauty listing—not a medical claim.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "FW-OL-100", mrpPaise: 34900, sellingPricePaise: 29900, onHand: 90, weightGrams: 120, hsnCode: "3304" },
    { slug: "aloe-moisturizer-tube", title: "Aloe daily moisturiser", summary: "Light gel moisturiser with aloe vera.", description: "Non-greasy formula for humid climates. Development seed SKU.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "MOI-AL-50", mrpPaise: 44900, sellingPricePaise: 37900, onHand: 70, weightGrams: 80, hsnCode: "3304" },
    { slug: "coconut-hair-oil-bottle", title: "Cold-pressed coconut hair oil", summary: "200 ml bottle for weekly hair oiling.", description: "Food-grade inspired packaging story for demo only. Fictional seed product.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "OIL-CN-200", mrpPaise: 29900, sellingPricePaise: 24900, onHand: 110, weightGrams: 220, hsnCode: "1513" },
    { slug: "charcoal-face-mask-sachets", title: "Charcoal face mask sachets", summary: "Pack of five single-use clay mask sachets.", description: "Travel-friendly sachets. Seed catalogue beauty item.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "MSK-CH-5", mrpPaise: 39900, sellingPricePaise: 32900, onHand: 60, weightGrams: 100, hsnCode: "3304" },
    { slug: "bamboo-toothbrush-twin", title: "Bamboo toothbrush twin pack", summary: "Biodegradable handles with medium bristles.", description: "Twin pack for couples or travel kits. Demo personal-care listing.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "TB-BM-2", mrpPaise: 24900, sellingPricePaise: 19900, onHand: 150, weightGrams: 40, hsnCode: "9603" },
    { slug: "vitamin-c-serum-dropper", title: "Vitamin C serum dropper", summary: "Brightening serum in UV-protective bottle.", description: "Cosmetic seed listing with realistic PDP copy. Not a clinical claim.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "SER-VC-30", mrpPaise: 79900, sellingPricePaise: 64900, onHand: 40, weightGrams: 70, hsnCode: "3304" },
    { slug: "lavender-body-lotion", title: "Lavender body lotion", summary: "Lightweight lotion for dry elbows and shins.", description: "Pump bottle suited for humid storage. Seed beauty SKU.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "LOT-LV-200", mrpPaise: 39900, sellingPricePaise: 39900, onHand: 55, weightGrams: 230, hsnCode: "3304" },
    { slug: "lip-balm-trio-tint", title: "Lip balm trio with tint", summary: "Three tinted balms in berry, nude, and clear.", description: "Pocket-sized tins. Useful for low-price cart tests.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "LIP-3", mrpPaise: 44900, sellingPricePaise: 34900, onHand: 4, weightGrams: 60, hsnCode: "3304" },
    { slug: "sandalwood-soap-bars", title: "Sandalwood soap bar trio", summary: "Handcrafted-style soap bars with mild fragrance.", description: "Gift-ready set. Fictional seed personal-care product.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "SOAP-SD-3", mrpPaise: 34900, sellingPricePaise: 27900, onHand: 85, weightGrams: 300, hsnCode: "3401" },
    { slug: "makeup-blender-sponge-set", title: "Makeup blender sponge set", summary: "Set of four latex-free blending sponges.", description: "Includes travel case. Seed listing for beauty accessories.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "BLD-4", mrpPaise: 49900, sellingPricePaise: 39900, onHand: 95, weightGrams: 50, hsnCode: "9616" },
  ]),
  ...productsFor("home-kitchen", [
    { slug: "stainless-steel-airtight-container", title: "Stainless steel airtight storage container", summary: "1.5 L container with silicone gasket lid.", description: "Stackable dabba for dals and snacks. Seed home & kitchen listing.", brandSlug: "aspera-home", sellerKey: "home", sku: "SS-AT-15", mrpPaise: 89900, sellingPricePaise: 69900, onHand: 64, weightGrams: 450, hsnCode: "7323" },
    { slug: "nonstick-dosa-tawa", title: "Non-stick dosa tawa", summary: "28 cm flat tawa with cool-touch handle.", description: "Even-heat aluminium base. Development seed cookware.", brandSlug: "aspera-home", sellerKey: "home", sku: "TAWA-28", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 30, weightGrams: 900, hsnCode: "7615" },
    { slug: "glass-mixing-bowl-set", title: "Glass mixing bowl set", summary: "Set of three nested borosilicate bowls.", description: "Microwave-safe bowls with lids. Seed kitchenware.", brandSlug: "aspera-home", sellerKey: "home", sku: "BWL-GL-3", mrpPaise: 149900, sellingPricePaise: 119900, onHand: 25, weightGrams: 1600, hsnCode: "7013" },
    { slug: "cotton-handloom-cushion-covers", title: "Cotton handloom cushion cover set", summary: "Set of two 16-inch cushion covers.", description: "Zippered covers in earthy weave. Fictional home décor seed.", brandSlug: "narmada-weave", sellerKey: "home", sku: "CUSH-2", mrpPaise: 99900, sellingPricePaise: 79900, onHand: 40, weightGrams: 380, hsnCode: "6304" },
    { slug: "silicone-spatula-set", title: "Silicone spatula set", summary: "Heat-resistant spatulas for non-stick pans.", description: "Three sizes with stainless cores. Seed utensil pack.", brandSlug: "aspera-home", sellerKey: "home", sku: "SPAT-3", mrpPaise: 59900, sellingPricePaise: 44900, onHand: 70, weightGrams: 220, hsnCode: "3924" },
    { slug: "electric-kettle-1-5l", title: "Electric kettle 1.5 L", summary: "Cordless kettle with auto shut-off.", description: "Boil-dry protection. Demo electronics-adjacent kitchen SKU.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "KTL-15", mrpPaise: 179900, sellingPricePaise: 149900, onHand: 20, weightGrams: 1100, hsnCode: "8516" },
    { slug: "spice-jar-carousel", title: "Spice jar carousel", summary: "Rotating rack with twelve glass jars.", description: "Labels included. Seed listing for dense browse grids.", brandSlug: "aspera-home", sellerKey: "home", sku: "SPC-12", mrpPaise: 159900, sellingPricePaise: 129900, onHand: 18, weightGrams: 1400, hsnCode: "7010" },
    { slug: "cast-iron-tadka-pan", title: "Cast iron tadka pan", summary: "Pre-seasoned mini pan for tempering spices.", description: "Works on gas and induction with diffuser. Seed cookware.", brandSlug: "aspera-home", sellerKey: "home", sku: "TDK-CI-01", mrpPaise: 89900, sellingPricePaise: 74900, onHand: 1, weightGrams: 800, hsnCode: "7321" },
    { slug: "kitchen-knife-trio", title: "Kitchen knife trio", summary: "Chef, utility, and paring knives with sheaths.", description: "Stainless blades for home cooks. Fictional seed product.", brandSlug: "aspera-home", sellerKey: "home", sku: "KNF-3", mrpPaise: 219900, sellingPricePaise: 179900, onHand: 22, weightGrams: 650, hsnCode: "8211" },
    { slug: "insulated-steel-tiffin", title: "Insulated steel tiffin", summary: "Two-tier lunch box with bag.", description: "Keeps meals warm for office commutes. Seed catalogue item.", brandSlug: "aspera-home", sellerKey: "home", sku: "TIF-2", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 35, weightGrams: 700, hsnCode: "7323" },
  ]),
  ...productsFor("electronics-accessories", [
    { slug: "wireless-neckband-type-c", title: "Wireless neckband with Type-C charging", summary: "Magnetic earbuds with 20-hour playback claim (demo).", description: "Bluetooth neckband for commuting. Seed electronics accessory—specs are fictional.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "NB-TC-01", mrpPaise: 249900, sellingPricePaise: 179900, onHand: 48, weightGrams: 45, hsnCode: "8518" },
    { slug: "usb-c-hub-7in1", title: "USB-C hub 7-in-1", summary: "HDMI, USB-A, SD, and PD pass-through hub.", description: "Laptop dock lite for creators. Development seed gadget.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "HUB-7", mrpPaise: 349900, sellingPricePaise: 279900, onHand: 27, weightGrams: 90, hsnCode: "8471" },
    { slug: "mechanical-keyboard-tkl", title: "Mechanical keyboard TKL", summary: "Hot-swappable tenkeyless keyboard.", description: "Quiet switches for shared workspaces. Seed listing.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "KB-TKL-01", mrpPaise: 599900, sellingPricePaise: 499900, onHand: 14, weightGrams: 750, hsnCode: "8471" },
    { slug: "noise-cancelling-overear", title: "Noise-cancelling over-ear headphones", summary: "Over-ear cans with foldable hinge.", description: "Demo audio product for high-price filters.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "HP-NC-01", mrpPaise: 799900, sellingPricePaise: 649900, onHand: 12, weightGrams: 280, hsnCode: "8518" },
    { slug: "webcam-1080p", title: "1080p webcam with privacy shutter", summary: "Plug-and-play webcam for video calls.", description: "Built-in mic. Seed electronics accessory.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "CAM-1080", mrpPaise: 299900, sellingPricePaise: 229900, onHand: 33, weightGrams: 120, hsnCode: "8525" },
    { slug: "portable-ssd-1tb", title: "Portable SSD 1 TB", summary: "USB-C external SSD in shock sleeve.", description: "Speed figures are illustrative only. Fictional seed SKU.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "SSD-1T", mrpPaise: 899900, sellingPricePaise: 749900, onHand: 9, weightGrams: 60, hsnCode: "8471" },
    { slug: "led-desk-lamp-usb", title: "LED desk lamp with USB port", summary: "Dimmable lamp with phone charging port.", description: "Three colour temperatures. Seed desk accessory.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "LAMP-USB", mrpPaise: 199900, sellingPricePaise: 159900, onHand: 40, weightGrams: 650, hsnCode: "9405" },
    { slug: "bluetooth-speaker-mini", title: "Mini Bluetooth speaker", summary: "Pocket speaker with IPX4 splash rating story.", description: "Demo audio accessory for deals rails.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "SPK-MINI", mrpPaise: 199900, sellingPricePaise: 149900, onHand: 55, weightGrams: 180, hsnCode: "8518" },
    { slug: "wireless-mouse-ergonomic", title: "Ergonomic wireless mouse", summary: "Silent clicks with USB receiver.", description: "Contoured for right-hand use. Seed peripheral.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "MSE-ERG", mrpPaise: 149900, sellingPricePaise: 119900, onHand: 0, weightGrams: 95, hsnCode: "8471" },
    { slug: "laptop-stand-aluminium", title: "Aluminium laptop stand", summary: "Ventilated stand for 13–16 inch laptops.", description: "Adjustable height. Seed catalogue gadget.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "STD-ALU", mrpPaise: 249900, sellingPricePaise: 199900, onHand: 24, weightGrams: 700, hsnCode: "8473" },
  ]),
  ...productsFor("mobile-accessories", [
    { slug: "clear-case-iphone-style", title: "Clear shockproof phone case", summary: "Universal clear case with reinforced corners.", description: "Fits common mid-size phones. Seed mobile accessory.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "CSE-CLR", mrpPaise: 79900, sellingPricePaise: 49900, onHand: 120, weightGrams: 40, hsnCode: "3926" },
    { slug: "30w-gan-charger", title: "30W GaN dual USB-C charger", summary: "Compact wall charger for phones and earbuds.", description: "Folding pins. Demo charger listing.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "CHG-30W", mrpPaise: 249900, sellingPricePaise: 189900, onHand: 45, weightGrams: 70, hsnCode: "8504" },
    { slug: "braided-type-c-cable-2m", title: "Braided Type-C cable 2 m", summary: "Nylon braided cable with strain relief.", description: "Data + charge. Seed cable SKU.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "CBL-2M", mrpPaise: 69900, sellingPricePaise: 44900, onHand: 200, weightGrams: 55, hsnCode: "8544" },
    { slug: "magnetic-car-mount", title: "Magnetic car phone mount", summary: "Vent-clip mount with metal plates.", description: "One-hand docking. Fictional seed accessory.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "CAR-MAG", mrpPaise: 99900, sellingPricePaise: 69900, onHand: 60, weightGrams: 85, hsnCode: "8708" },
    { slug: "power-bank-10000mah", title: "10,000 mAh power bank", summary: "Slim power bank with dual output.", description: "Capacity figures are illustrative. Seed listing.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "PB-10K", mrpPaise: 199900, sellingPricePaise: 149900, onHand: 38, weightGrams: 220, hsnCode: "8507" },
    { slug: "tempered-glass-2pack", title: "Tempered glass 2-pack", summary: "Edge-to-edge glass with install kit.", description: "Fits common 6.1–6.7 inch phones. Seed accessory.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "TG-2", mrpPaise: 59900, sellingPricePaise: 39900, onHand: 150, weightGrams: 30, hsnCode: "7007" },
    { slug: "ring-light-clip", title: "Clip-on ring light", summary: "Rechargeable selfie light for creators.", description: "Three brightness levels. Demo mobile accessory.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "RING-CL", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 42, weightGrams: 110, hsnCode: "9405" },
    { slug: "wireless-charger-pad", title: "Wireless charger pad", summary: "15W max pad with LED indicator.", description: "Qi-compatible story for demos. Seed product.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "WLC-PAD", mrpPaise: 179900, sellingPricePaise: 129900, onHand: 5, weightGrams: 140, hsnCode: "8504" },
    { slug: "earbuds-case-cover", title: "Earbuds case silicone cover", summary: "Protective cover with carabiner.", description: "Fits popular stem-bud cases. Seed SKU.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "EBC-SL", mrpPaise: 49900, sellingPricePaise: 29900, onHand: 90, weightGrams: 25, hsnCode: "3926" },
    { slug: "phone-tripod-flexible", title: "Flexible phone tripod", summary: "Bendable legs with Bluetooth shutter.", description: "Desk and rail mounting. Seed accessory.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "TRP-FLX", mrpPaise: 149900, sellingPricePaise: 109900, onHand: 33, weightGrams: 180, hsnCode: "9620" },
  ]),
  ...productsFor("health-wellness", [
    { slug: "yoga-mat-6mm", title: "Yoga mat 6 mm", summary: "Non-slip mat with carry strap.", description: "Home practice mat. Seed wellness product.", brandSlug: "pulse-fit", sellerKey: "wellness", sku: "YG-6MM", mrpPaise: 149900, sellingPricePaise: 119900, onHand: 40, weightGrams: 1100, hsnCode: "9506" },
    { slug: "resistance-band-set", title: "Resistance band set", summary: "Five latex bands with door anchor.", description: "Strength training starter kit. Demo fitness seed.", brandSlug: "pulse-fit", sellerKey: "wellness", sku: "RB-5", mrpPaise: 99900, sellingPricePaise: 79900, onHand: 55, weightGrams: 400, hsnCode: "9506" },
    { slug: "copper-bottle-950ml", title: "Copper water bottle 950 ml", summary: "Leak-resistant copper bottle with lid.", description: "Traditional-style bottle for desks. Seed listing.", brandSlug: "aspera-home", sellerKey: "wellness", sku: "CU-950", mrpPaise: 89900, sellingPricePaise: 69900, onHand: 48, weightGrams: 350, hsnCode: "7418" },
    { slug: "digital-weighing-scale", title: "Digital weighing scale", summary: "Tempered glass scale with LCD.", description: "Bathroom scale for wellness routines. Fictional seed SKU.", brandSlug: "pulse-fit", sellerKey: "wellness", sku: "SCL-DIG", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 28, weightGrams: 1600, hsnCode: "8423" },
    { slug: "foam-roller-grid", title: "Grid foam roller", summary: "33 cm roller for muscle recovery.", description: "High-density foam. Seed sports-adjacent wellness item.", brandSlug: "pulse-fit", sellerKey: "wellness", sku: "FR-33", mrpPaise: 119900, sellingPricePaise: 89900, onHand: 22, weightGrams: 500, hsnCode: "9506" },
    { slug: "herbal-green-tea-box", title: "Herbal green tea box", summary: "25 biodegradable tea bags.", description: "Evening wind-down tea. Demo consumable seed—not a health claim.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "TEA-GR-25", mrpPaise: 34900, sellingPricePaise: 29900, onHand: 100, weightGrams: 80, hsnCode: "0902" },
    { slug: "posture-corrector-brace", title: "Posture corrector brace", summary: "Adjustable upper-back support brace.", description: "Desk worker accessory. Seed wellness SKU.", brandSlug: "pulse-fit", sellerKey: "wellness", sku: "PST-01", mrpPaise: 99900, sellingPricePaise: 74900, onHand: 35, weightGrams: 150, hsnCode: "9021" },
    { slug: "sleep-eye-mask-silk", title: "Silk-feel sleep eye mask", summary: "Contoured mask with adjustable strap.", description: "Light-blocking for travel. Seed product.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "EYE-SL", mrpPaise: 59900, sellingPricePaise: 44900, onHand: 70, weightGrams: 40, hsnCode: "6307" },
    { slug: "jump-rope-bearing", title: "Bearing jump rope", summary: "Adjustable rope with comfortable grips.", description: "Cardio accessory. Development seed.", brandSlug: "pulse-fit", sellerKey: "wellness", sku: "JR-BR", mrpPaise: 69900, sellingPricePaise: 49900, onHand: 60, weightGrams: 200, hsnCode: "9506" },
    { slug: "wellness-draft-supplement", title: "Draft herbal gummies (unpublished)", summary: "Draft listing to test seller catalogue moderation.", description: "Not customer-visible. Seed draft only—no supplement claims.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "DRF-GUM", mrpPaise: 79900, sellingPricePaise: 69900, onHand: 20, weightGrams: 150, hsnCode: "2106", status: "draft" },
    { slug: "cork-yoga-mat-strap", title: "Cork yoga mat with strap", summary: "Natural cork top mat with cotton carry strap.", description: "Extra approved wellness listing so the category stays image-rich on the storefront.", brandSlug: "pulse-fit", sellerKey: "wellness", sku: "YG-CORK", mrpPaise: 249900, sellingPricePaise: 199900, onHand: 18, weightGrams: 1300, hsnCode: "9506" },
  ]),
  ...productsFor("baby-kids", [
    { slug: "organic-cotton-onesie", title: "Organic cotton onesie", summary: "Snap-button onesie for newborns.", description: "Soft jersey for sensitive skin. Seed baby listing.", brandSlug: "little-lotus", sellerKey: "fashion", sku: "ONE-NB", mrpPaise: 79900, sellingPricePaise: 59900, onHand: 40, weightGrams: 120, hsnCode: "6111" },
    { slug: "silicone-bib-catcher", title: "Silicone bib with catcher", summary: "Wipe-clean bib for weaning.", description: "Adjustable neck. Demo kids feeding accessory.", brandSlug: "little-lotus", sellerKey: "home", sku: "BIB-SL", mrpPaise: 49900, sellingPricePaise: 39900, onHand: 65, weightGrams: 90, hsnCode: "3924" },
    { slug: "wooden-stacking-rings", title: "Wooden stacking rings", summary: "Classic stacking toy with smooth finish.", description: "Painted rings for toddlers. Seed toy.", brandSlug: "little-lotus", sellerKey: "home", sku: "TOY-RG", mrpPaise: 89900, sellingPricePaise: 69900, onHand: 30, weightGrams: 400, hsnCode: "9503" },
    { slug: "kids-stainless-bottle", title: "Kids stainless bottle 400 ml", summary: "Leak-resistant bottle with straw lid.", description: "School-bag friendly. Fictional seed product.", brandSlug: "little-lotus", sellerKey: "home", sku: "BTL-KD", mrpPaise: 79900, sellingPricePaise: 64900, onHand: 50, weightGrams: 220, hsnCode: "7323" },
    { slug: "muslin-swaddle-set", title: "Muslin swaddle set", summary: "Set of three breathable swaddles.", description: "Multi-use cloths. Seed baby textile.", brandSlug: "little-lotus", sellerKey: "fashion", sku: "SWA-3", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 28, weightGrams: 300, hsnCode: "6301" },
    { slug: "soft-book-crinkle", title: "Crinkle soft book", summary: "Fabric book with high-contrast pages.", description: "Tummy-time toy. Development seed.", brandSlug: "little-lotus", sellerKey: "home", sku: "BOOK-CR", mrpPaise: 59900, sellingPricePaise: 44900, onHand: 45, weightGrams: 80, hsnCode: "9503" },
    { slug: "kids-raincoat-packable", title: "Packable kids raincoat", summary: "Lightweight raincoat with pouch.", description: "Monsoon essential. Seed apparel.", brandSlug: "little-lotus", sellerKey: "fashion", sku: "RAIN-KD", mrpPaise: 119900, sellingPricePaise: 89900, onHand: 20, weightGrams: 250, hsnCode: "6201" },
    { slug: "baby-nail-care-kit", title: "Baby nail care kit", summary: "Rounded clippers and file in case.", description: "Grooming kit. Seed personal-care adjacent kids item.", brandSlug: "little-lotus", sellerKey: "wellness", sku: "NAIL-BB", mrpPaise: 39900, sellingPricePaise: 29900, onHand: 70, weightGrams: 50, hsnCode: "8214" },
    { slug: "plush-elephant-soft-toy", title: "Plush elephant soft toy", summary: "Embroidered-eye plush for cuddles.", description: "Machine-washable cover story for demos. Seed toy.", brandSlug: "little-lotus", sellerKey: "home", sku: "PLUSH-EL", mrpPaise: 99900, sellingPricePaise: 79900, onHand: 35, weightGrams: 280, hsnCode: "9503" },
    { slug: "kids-tableware-set", title: "Kids bamboo tableware set", summary: "Plate, bowl, and spoon set.", description: "Sectioned plate for picky eaters. Seed listing.", brandSlug: "little-lotus", sellerKey: "home", sku: "TBW-KD", mrpPaise: 89900, sellingPricePaise: 69900, onHand: 3, weightGrams: 320, hsnCode: "4419" },
  ]),
  ...productsFor("stationery-office", [
    { slug: "dotted-notebook-a5", title: "Dotted notebook A5", summary: "192-page dotted journal with elastic band.", description: "Ivory paper for pens and pencils. Seed stationery.", brandSlug: "ink-and-quill", sellerKey: "home", sku: "NB-A5-D", mrpPaise: 49900, sellingPricePaise: 39900, onHand: 80, weightGrams: 280, hsnCode: "4820" },
    { slug: "bamboo-desk-organizer", title: "Bamboo desk organiser", summary: "Multi-compartment organiser for pens and sticky notes.", description: "Natural bamboo finish. Demo office product.", brandSlug: "ink-and-quill", sellerKey: "home", sku: "ORG-BM", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 25, weightGrams: 600, hsnCode: "4420" },
    { slug: "gel-pen-set-12", title: "Gel pen set of 12", summary: "Smooth 0.5 mm gel pens in assorted colours.", description: "Office and student pack. Seed stationery.", brandSlug: "ink-and-quill", sellerKey: "home", sku: "PEN-12", mrpPaise: 34900, sellingPricePaise: 24900, onHand: 150, weightGrams: 120, hsnCode: "9608" },
    { slug: "sticky-notes-pastel-pack", title: "Pastel sticky notes pack", summary: "Five pads in soft pastel colours.", description: "70 sheets each. Seed office consumable.", brandSlug: "ink-and-quill", sellerKey: "home", sku: "STK-5", mrpPaise: 29900, sellingPricePaise: 19900, onHand: 200, weightGrams: 150, hsnCode: "4820" },
    { slug: "accordion-file-folder", title: "Accordion file folder", summary: "13-pocket expanding file for A4 documents.", description: "Elastic closure. Fictional seed SKU.", brandSlug: "ink-and-quill", sellerKey: "home", sku: "FILE-13", mrpPaise: 59900, sellingPricePaise: 44900, onHand: 40, weightGrams: 350, hsnCode: "4820" },
    { slug: "whiteboard-starter-kit", title: "Whiteboard starter kit", summary: "Markers, eraser, and cleaner spray.", description: "For home offices. Seed listing.", brandSlug: "ink-and-quill", sellerKey: "home", sku: "WB-KIT", mrpPaise: 79900, sellingPricePaise: 59900, onHand: 30, weightGrams: 400, hsnCode: "9608" },
    { slug: "planner-undated-weekly", title: "Undated weekly planner", summary: "Hardcover weekly planner without year lock-in.", description: "Goal pages included. Seed stationery.", brandSlug: "ink-and-quill", sellerKey: "home", sku: "PLN-WK", mrpPaise: 69900, sellingPricePaise: 54900, onHand: 55, weightGrams: 320, hsnCode: "4820" },
    { slug: "desk-scissors-titanium", title: "Titanium-coated desk scissors", summary: "8-inch scissors with soft grip.", description: "Office cutting tool. Demo seed product.", brandSlug: "ink-and-quill", sellerKey: "home", sku: "SCS-8", mrpPaise: 44900, sellingPricePaise: 34900, onHand: 70, weightGrams: 90, hsnCode: "8213" },
    { slug: "cable-clips-desktop", title: "Desktop cable clips pack", summary: "Pack of ten adhesive cable organisers.", description: "Keeps chargers tidy. Seed accessory.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "CLP-10", mrpPaise: 29900, sellingPricePaise: 19900, onHand: 0, weightGrams: 40, hsnCode: "3926" },
    { slug: "label-maker-handheld", title: "Handheld label maker", summary: "QWERTY label printer for home filing.", description: "Includes starter tape. Seed office gadget.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "LBL-HH", mrpPaise: 299900, sellingPricePaise: 249900, onHand: 15, weightGrams: 350, hsnCode: "8472" },
  ]),
  ...productsFor("sports-fitness", [
    { slug: "lightweight-running-shoes", title: "Lightweight running shoes", summary: "Breathable mesh trainers for daily runs.", description: "Cushioned midsole story for demos. Seed footwear-adjacent sports SKU.", brandSlug: "trailmark", sellerKey: "fashion", sku: "RUN-LT", mrpPaise: 399900, sellingPricePaise: 329900, onHand: 24, weightGrams: 550, hsnCode: "6404" },
    { slug: "adjustable-dumbbell-pair", title: "Adjustable dumbbell pair", summary: "Pair of dial dumbbells for home gyms.", description: "Weight plates illustrated only. Seed fitness gear.", brandSlug: "pulse-fit", sellerKey: "wellness", sku: "DB-ADJ", mrpPaise: 899900, sellingPricePaise: 749900, onHand: 8, weightGrams: 12000, hsnCode: "9506" },
    { slug: "gym-duffel-bag", title: "Gym duffel bag", summary: "Water-resistant duffel with shoe pocket.", description: "Weekend and gym carry. Seed sports bag.", brandSlug: "trailmark", sellerKey: "fashion", sku: "DFL-GYM", mrpPaise: 199900, sellingPricePaise: 159900, onHand: 30, weightGrams: 600, hsnCode: "4202" },
    { slug: "protein-shaker-bottle", title: "Protein shaker bottle", summary: "700 ml shaker with mixing ball.", description: "Leak-resistant lid. Demo fitness accessory.", brandSlug: "pulse-fit", sellerKey: "wellness", sku: "SHK-700", mrpPaise: 49900, sellingPricePaise: 34900, onHand: 90, weightGrams: 150, hsnCode: "3924" },
    { slug: "sports-water-bottle-insulated", title: "Insulated sports bottle 750 ml", summary: "Double-wall bottle that keeps drinks cold.", description: "Sweat-proof exterior. Seed listing.", brandSlug: "trailmark", sellerKey: "wellness", sku: "BTL-750", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 40, weightGrams: 320, hsnCode: "9617" },
    { slug: "ankle-weights-pair", title: "Ankle weights pair", summary: "Adjustable ankle weights for walks.", description: "Velcro straps. Fictional seed product.", brandSlug: "pulse-fit", sellerKey: "wellness", sku: "ANK-WT", mrpPaise: 149900, sellingPricePaise: 119900, onHand: 20, weightGrams: 2000, hsnCode: "9506" },
    { slug: "yoga-block-pair", title: "Yoga block pair", summary: "EVA foam blocks for alignment support.", description: "Bevelled edges. Seed yoga accessory.", brandSlug: "pulse-fit", sellerKey: "wellness", sku: "YB-2", mrpPaise: 79900, sellingPricePaise: 59900, onHand: 50, weightGrams: 400, hsnCode: "9506" },
    { slug: "cycling-gloves-gel", title: "Gel-padded cycling gloves", summary: "Touchscreen-compatible finger tips.", description: "Road and indoor cycling. Seed gear.", brandSlug: "trailmark", sellerKey: "fashion", sku: "GLV-CYC", mrpPaise: 99900, sellingPricePaise: 79900, onHand: 35, weightGrams: 80, hsnCode: "6116" },
    { slug: "agility-ladder", title: "Agility ladder", summary: "Adjustable rungs for footwork drills.", description: "Includes carry bag. Development seed.", brandSlug: "pulse-fit", sellerKey: "wellness", sku: "AGL-LD", mrpPaise: 119900, sellingPricePaise: 89900, onHand: 18, weightGrams: 500, hsnCode: "9506" },
    { slug: "sports-submitted-knee-sleeve", title: "Submitted knee sleeve (moderation)", summary: "Compression knee sleeve awaiting approval.", description: "Seller submitted status for admin queue tests. Not public until approved.", brandSlug: "pulse-fit", sellerKey: "wellness", sku: "KNE-SUB", mrpPaise: 89900, sellingPricePaise: 69900, onHand: 25, weightGrams: 100, hsnCode: "6307", status: "submitted" },
    { slug: "hybrid-training-shorts", title: "Hybrid training shorts", summary: "Quick-dry shorts with zip pocket.", description: "Extra approved sports listing for browse density and filter testing.", brandSlug: "trailmark", sellerKey: "fashion", sku: "SHT-TR", mrpPaise: 149900, sellingPricePaise: 119900, onHand: 36, weightGrams: 220, hsnCode: "6103" },
  ]),
  ...productsFor("bags-footwear", [
    { slug: "leatherette-sling-bag", title: "Leatherette sling bag", summary: "Crossbody sling with adjustable strap.", description: "Everyday city bag. Seed fashion accessory.", brandSlug: "trailmark", sellerKey: "fashion", sku: "SLG-LT", mrpPaise: 149900, sellingPricePaise: 119900, onHand: 32, weightGrams: 350, hsnCode: "4202" },
    { slug: "canvas-backpack-laptop", title: "Canvas laptop backpack", summary: "Padded 15-inch sleeve backpack.", description: "Water-resistant base. Demo bag listing.", brandSlug: "trailmark", sellerKey: "fashion", sku: "BP-CV", mrpPaise: 249900, sellingPricePaise: 199900, onHand: 20, weightGrams: 700, hsnCode: "4202" },
    { slug: "kolhapuri-style-sandals", title: "Kolhapuri-style sandals", summary: "Hand-finish inspired flat sandals.", description: "Everyday ethnic footwear story for demos. Seed product.", brandSlug: "narmada-weave", sellerKey: "fashion", sku: "SND-KH", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 28, weightGrams: 400, hsnCode: "6403" },
    { slug: "memory-foam-slippers", title: "Memory foam house slippers", summary: "Closed-toe slippers with soft sole.", description: "Indoor comfort. Seed footwear.", brandSlug: "aspera-home", sellerKey: "home", sku: "SLP-MF", mrpPaise: 89900, sellingPricePaise: 69900, onHand: 45, weightGrams: 300, hsnCode: "6404" },
    { slug: "weekender-duffel", title: "Weekender duffel", summary: "Soft-sided duffel for short trips.", description: "Shoe compartment. Fictional seed bag.", brandSlug: "trailmark", sellerKey: "fashion", sku: "DFL-WK", mrpPaise: 299900, sellingPricePaise: 249900, onHand: 14, weightGrams: 800, hsnCode: "4202" },
    { slug: "canvas-tote-market", title: "Heavy canvas market tote", summary: "Open tote with interior pocket.", description: "Grocery and books. Seed listing.", brandSlug: "narmada-weave", sellerKey: "fashion", sku: "TOTE-HV", mrpPaise: 79900, sellingPricePaise: 59900, onHand: 60, weightGrams: 280, hsnCode: "4202" },
    { slug: "running-socks-3pack", title: "Running socks 3-pack", summary: "Cushioned ankle socks with arch support.", description: "Moisture-wicking story for demos. Seed apparel.", brandSlug: "trailmark", sellerKey: "fashion", sku: "SOX-3", mrpPaise: 69900, sellingPricePaise: 49900, onHand: 100, weightGrams: 120, hsnCode: "6115" },
    { slug: "formal-belt-reversible", title: "Reversible formal belt", summary: "Black/brown reversible belt with boxed buckle.", description: "Office wardrobe staple. Seed accessory.", brandSlug: "narmada-weave", sellerKey: "fashion", sku: "BLT-RV", mrpPaise: 99900, sellingPricePaise: 79900, onHand: 40, weightGrams: 150, hsnCode: "4203" },
    { slug: "kids-velcro-sneakers", title: "Kids velcro sneakers", summary: "Easy-on sneakers for school days.", description: "Breathable upper. Seed kids footwear.", brandSlug: "little-lotus", sellerKey: "fashion", sku: "SNK-KD", mrpPaise: 149900, sellingPricePaise: 119900, onHand: 22, weightGrams: 320, hsnCode: "6404" },
    { slug: "travel-packing-cubes", title: "Travel packing cubes set", summary: "Set of four cubes for organised packing.", description: "Mesh tops. Seed travel accessory.", brandSlug: "trailmark", sellerKey: "fashion", sku: "CUBE-4", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 2, weightGrams: 280, hsnCode: "4202" },
  ]),
  ...productsFor("household-essentials", [
    { slug: "floor-cleaner-citrus", title: "Citrus floor cleaner 1 L", summary: "Concentrated cleaner for tile floors.", description: "Dilutable formula. Seed household consumable—not a chemical claim.", brandSlug: "aspera-home", sellerKey: "home", sku: "CLN-FL-1L", mrpPaise: 24900, sellingPricePaise: 19900, onHand: 120, weightGrams: 1100, hsnCode: "3402" },
    { slug: "dishwash-liquid-refill", title: "Dishwash liquid refill 1.5 L", summary: "Lemon dishwash refill pouch.", description: "Pouch reduces plastic vs bottles. Demo seed item.", brandSlug: "aspera-home", sellerKey: "home", sku: "DSH-15", mrpPaise: 29900, sellingPricePaise: 24900, onHand: 90, weightGrams: 1550, hsnCode: "3402" },
    { slug: "garbage-bags-medium", title: "Medium garbage bags roll", summary: "30-bag roll with easy-tie flaps.", description: "Kitchen bin size. Seed utility product.", brandSlug: "aspera-home", sellerKey: "home", sku: "BAG-M-30", mrpPaise: 19900, sellingPricePaise: 14900, onHand: 200, weightGrams: 400, hsnCode: "3923" },
    { slug: "microfiber-mop-refill", title: "Microfibre mop refill pad", summary: "Washable pad compatible with flat mops.", description: "Velcro attach. Seed household essential.", brandSlug: "aspera-home", sellerKey: "home", sku: "MOP-RF", mrpPaise: 34900, sellingPricePaise: 27900, onHand: 75, weightGrams: 120, hsnCode: "6307" },
    { slug: "glass-cleaner-spray", title: "Glass cleaner spray 500 ml", summary: "Streak-free spray for windows and mirrors.", description: "Trigger bottle. Fictional seed SKU.", brandSlug: "aspera-home", sellerKey: "home", sku: "GLS-500", mrpPaise: 19900, sellingPricePaise: 19900, onHand: 85, weightGrams: 550, hsnCode: "3402" },
    { slug: "laundry-detergent-pods", title: "Laundry detergent pods", summary: "Pack of twenty dissolvable pods.", description: "Front-load friendly story for demos. Seed consumable.", brandSlug: "aspera-home", sellerKey: "home", sku: "DET-20", mrpPaise: 44900, sellingPricePaise: 37900, onHand: 60, weightGrams: 500, hsnCode: "3402" },
    { slug: "toilet-cleaner-thick", title: "Thick toilet cleaner 500 ml", summary: "Angled-neck bottle for under-rim cleaning.", description: "Household hygiene essential. Seed listing.", brandSlug: "aspera-home", sellerKey: "home", sku: "TLT-500", mrpPaise: 14900, sellingPricePaise: 11900, onHand: 110, weightGrams: 560, hsnCode: "3402" },
    { slug: "scrub-pads-multipack", title: "Scrub pads multipack", summary: "Pack of six dual-side scrubbers.", description: "Kitchen sink staple. Seed product.", brandSlug: "aspera-home", sellerKey: "home", sku: "SCR-6", mrpPaise: 14900, sellingPricePaise: 9900, onHand: 180, weightGrams: 100, hsnCode: "6805" },
    { slug: "room-freshener-gel", title: "Room freshener gel can", summary: "Long-lasting gel fragrance for living rooms.", description: "Demo fragrance SKU—not a performance guarantee.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "FRS-GEL", mrpPaise: 24900, sellingPricePaise: 19900, onHand: 70, weightGrams: 200, hsnCode: "3307" },
    { slug: "dustpan-broom-compact", title: "Compact dustpan and broom", summary: "Standing dustpan set for quick clean-ups.", description: "Apartment-friendly size. Seed household tool.", brandSlug: "aspera-home", sellerKey: "home", sku: "DPS-SET", mrpPaise: 39900, sellingPricePaise: 29900, onHand: 4, weightGrams: 450, hsnCode: "9603" },
  ]),
];

export function imagesForProduct(
  categorySlug: string,
  title: string,
  index: number,
): Array<{ url: string; altText: string; sortOrder: number; isPrimary: boolean }> {
  const category = SEED_CATEGORIES.find((entry) => entry.slug === categorySlug);
  const pool = category?.imagePool ?? SEED_CATEGORIES[0]!.imagePool;
  const primary = pool[index % pool.length]!;
  const secondary = pool[(index + 1) % pool.length]!;
  const tertiary = pool[(index + 2) % pool.length]!;
  return [
    { url: primary, altText: `${title} — primary view`, sortOrder: 0, isPrimary: true },
    { url: secondary, altText: `${title} — alternate view`, sortOrder: 1, isPrimary: false },
    { url: tertiary, altText: `${title} — detail view`, sortOrder: 2, isPrimary: false },
  ];
}
