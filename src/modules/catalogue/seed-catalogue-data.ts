/**
 * Preview catalogue definitions for Aspera Marketplace storefront demos.
 * Product copy is customer-facing Meesho-style descriptions — not production inventory.
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
  sellerKey: "home" | "fashion" | "tech" | "wellness" | "textile" | "sports" | "mumbai" | "artisan";
  sku: string;
  mrpPaise: number;
  sellingPricePaise: number;
  onHand: number;
  weightGrams: number;
  hsnCode: string;
  status?: "approved" | "draft" | "submitted";
};

/** Curated Unsplash photo IDs for preview catalogue imagery. */
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
      U("photo-1600585154340-be6161a56a0c"),
      U("photo-1493666438817-866a91353ca9"),
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
      U("photo-1515886657613-9f3515b0c78f"),
      U("photo-1469334031218-e382a71b716b"),
      U("photo-1434389677669-e08b4cac3105"),
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
      U("photo-1612817288484-6f916006741a"),
      U("photo-1556228578-0d85b1a4d571"),
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
      U("photo-1556912173-46c336c7fd55"),
      U("photo-1616046229478-9901c5536a45"),
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
      U("photo-1546435770-a3e426bf472b"),
      U("photo-1583394838336-acd977736f90"),
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
      U("photo-1605236453806-6ff36851218e"),
      U("photo-1592899677977-9c10ca588bbd"),
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
      U("photo-1518611012118-696072aa579a"),
      U("photo-1576678927484-cc907957088c"),
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
      U("photo-1519689373023-dd07c7988603"),
      U("photo-1503919545889-aef44e1b0f0b"),
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
      U("photo-1456735190827-d1262f71b8a3"),
      U("photo-1586075010923-2dd4570fb338"),
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
      U("photo-1518611012118-696072aa579a"),
      U("photo-1599058945522-28d272b53567"),
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
      U("photo-1543163521-1bf539c55dd2"),
      U("photo-1622560480605-d83c853bc5c3"),
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
      U("photo-1585421514738-01798e348b17"),
      U("photo-1527515637462-cff94eecc1ac"),
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
    { slug: "cotton-tea-towel-set-demo", title: "Cotton tea towel set", summary: "Pack of three absorbent cotton tea towels for everyday kitchens.", description: "Soft cotton tea towels with hanging loops for drying crockery and wiping counters. Absorbent weave that softens with every wash. A practical three-pack for everyday kitchens.", brandSlug: "aspera-home", sellerKey: "home", sku: "TOWEL-SET-01", mrpPaise: 59900, sellingPricePaise: 39900, onHand: 40, weightGrams: 350, hsnCode: "6302" },
    { slug: "bamboo-laundry-basket", title: "Bamboo laundry basket", summary: "Ventilated bamboo hamper with cotton liner.", description: "Lightweight rectangular bamboo hamper with a removable cotton liner. Ventilated sides keep laundry fresh between washes. Ideal for bedrooms, balconies, and compact apartments.", brandSlug: "aspera-home", sellerKey: "home", sku: "BAM-LB-01", mrpPaise: 189900, sellingPricePaise: 149900, onHand: 18, weightGrams: 2200, hsnCode: "4602" },
    { slug: "microfibre-cleaning-cloth-pack", title: "Microfibre cleaning cloth pack", summary: "Set of eight colour-coded microfibre cloths.", description: "Lint-free microfibre cloths colour-coded for glass, kitchen, and electronics. Trap dust without harsh chemicals and rinse clean quickly. Soft enough for screens yet tough on grease.", brandSlug: "aspera-home", sellerKey: "home", sku: "MF-CL-08", mrpPaise: 49900, sellingPricePaise: 34900, onHand: 120, weightGrams: 280, hsnCode: "6307" },
    { slug: "foldable-shopping-tote", title: "Foldable shopping tote", summary: "Compact nylon tote that packs into a pouch.", description: "Compact nylon market tote that packs into its own pouch. Reinforced handles carry weekly groceries without stretching. Reusable, washable, and light enough for every outing.", brandSlug: "narmada-weave", sellerKey: "fashion", sku: "TOTE-FLD-01", mrpPaise: 39900, sellingPricePaise: 29900, onHand: 75, weightGrams: 120, hsnCode: "4202" },
    { slug: "silicone-ice-tray-with-lid", title: "Silicone ice tray with lid", summary: "Flexible tray for slow-melt cubes with spill-proof lid.", description: "Flexible freezer-safe silicone tray for slow-melt cubes with a spill-proof lid. The lid reduces odour transfer from other freezer items. Easy to twist-release cubes into glasses or bottles.", brandSlug: "aspera-home", sellerKey: "home", sku: "ICE-SL-01", mrpPaise: 44900, sellingPricePaise: 44900, onHand: 55, weightGrams: 220, hsnCode: "3924" },
    { slug: "cotton-floor-duster", title: "Cotton floor duster", summary: "Traditional cotton thread mop head with wooden handle.", description: "Traditional cotton-thread mop head on a sturdy wooden handle. Covers tile and marble floors quickly between deep cleans. Replacement-ready design for long-term household use.", brandSlug: "aspera-home", sellerKey: "home", sku: "DST-CT-01", mrpPaise: 34900, sellingPricePaise: 24900, onHand: 3, weightGrams: 900, hsnCode: "9603" },
    { slug: "steel-peg-hanger-pack", title: "Steel peg hanger pack", summary: "Pack of twenty rust-resistant clothes pegs.", description: "Pack of twenty rust-resistant spring pegs for balcony drying lines. Strong grip holds towels and sheets even in breeze. Compact storage clip keeps the set organised.", brandSlug: "aspera-home", sellerKey: "home", sku: "PEG-ST-20", mrpPaise: 19900, sellingPricePaise: 14900, onHand: 200, weightGrams: 320, hsnCode: "7326" },
    { slug: "scented-soy-votive-trio", title: "Scented soy votive trio", summary: "Three soy wax votives in sandalwood, citrus, and jasmine.", description: "Three soy-wax votives in sandalwood, citrus, and jasmine for shelves and bathrooms. Clean-burning wax with a gentle evening glow. Gift-ready set for small spaces.", brandSlug: "coastal-bloom", sellerKey: "artisan", sku: "VOTE-3", mrpPaise: 69900, sellingPricePaise: 54900, onHand: 40, weightGrams: 450, hsnCode: "3406" },
    { slug: "reusable-produce-mesh-bags", title: "Reusable produce mesh bags", summary: "Set of five washable mesh bags for fruits and vegetables.", description: "Set of five washable mesh bags with drawcords for fruits and vegetables. Lightweight enough for market runs and fridge storage. Cut down on single-use plastic while keeping produce visible.", brandSlug: "narmada-weave", sellerKey: "home", sku: "MESH-5", mrpPaise: 59900, sellingPricePaise: 39900, onHand: 0, weightGrams: 150, hsnCode: "6307" },
    { slug: "digital-kitchen-timer", title: "Digital kitchen timer", summary: "Magnetic countdown timer with loud alert.", description: "Magnetic LCD countdown timer with a loud alert for busy cooks. Stick it on the fridge or oven door while you prep. Simple controls for baking, boiling, and school routines.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "TMR-DIG-01", mrpPaise: 49900, sellingPricePaise: 37900, onHand: 60, weightGrams: 90, hsnCode: "9106" },
    { slug: "general-merch-draft-organiser", title: "Draft desk caddy (unpublished)", summary: "Draft listing used to test seller moderation queues.", description: "Multi-compartment desk caddy awaiting catalogue approval. Holds pens, clips, and sticky notes within arm’s reach. Not yet visible on the public storefront.", brandSlug: "ink-and-quill", sellerKey: "home", sku: "DRF-CAD-01", mrpPaise: 79900, sellingPricePaise: 59900, onHand: 10, weightGrams: 400, hsnCode: "3926", status: "draft" },
  ]),
  ...productsFor("fashion", [
    { slug: "handloom-cotton-kurta", title: "Handloom cotton kurta", summary: "Breathable mid-length kurta with side slits.", description: "Breathable mid-length handloom cotton kurta with side slits for easy movement. Soft fabric suited to warm weather and festive casual days. Pair with jeans, churidars, or palazzos.", brandSlug: "narmada-weave", sellerKey: "textile", sku: "KUR-HL-M", mrpPaise: 189900, sellingPricePaise: 149900, onHand: 28, weightGrams: 320, hsnCode: "6205" },
    { slug: "linen-blend-shirt", title: "Linen-blend casual shirt", summary: "Relaxed fit shirt with coconut buttons.", description: "Relaxed-fit linen-blend shirt with coconut buttons and an easy-iron finish. Ideal for office Fridays and weekend brunches. Layers well under light jackets in cooler evenings.", brandSlug: "narmada-weave", sellerKey: "mumbai", sku: "SHT-LN-01", mrpPaise: 219900, sellingPricePaise: 179900, onHand: 22, weightGrams: 280, hsnCode: "6205" },
    { slug: "everyday-cotton-tee-pack", title: "Everyday cotton tee pack", summary: "Pack of three solid crew-neck tees.", description: "Pack of three solid crew-neck tees in mid-weight jersey. Soft handfeel that holds shape after washes. Everyday essentials for layering, lounging, or gym-to-errands days.", brandSlug: "narmada-weave", sellerKey: "fashion", sku: "TEE-3PK", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 80, weightGrams: 450, hsnCode: "6109" },
    { slug: "block-print-dupatta", title: "Block-print cotton dupatta", summary: "Lightweight dupatta with vegetable-dye motifs.", description: "Lightweight cotton dupatta with vegetable-dye inspired block motifs. Drapes softly over kurtas and dresses without bulk. An easy way to refresh ethnic looks across seasons.", brandSlug: "narmada-weave", sellerKey: "textile", sku: "DUP-BP-01", mrpPaise: 89900, sellingPricePaise: 69900, onHand: 35, weightGrams: 180, hsnCode: "6214" },
    { slug: "stretch-denim-jegging", title: "Stretch denim jegging", summary: "High-rise jegging with soft stretch denim.", description: "High-rise jegging in soft stretch denim for all-day comfort. Machine-washable everyday bottomwear that moves with you. Pair with kurtis, tunics, or casual tees.", brandSlug: "narmada-weave", sellerKey: "fashion", sku: "JEG-STR-01", mrpPaise: 159900, sellingPricePaise: 129900, onHand: 40, weightGrams: 420, hsnCode: "6204" },
    { slug: "embroidered-cotton-palazzo", title: "Embroidered cotton palazzo", summary: "Flared palazzo with ankle embroidery.", description: "Flared cotton palazzo with delicate ankle embroidery. Comfortable for festive casual wear and long days out. Breathable fabric that pairs with short kurtas or crop tops.", brandSlug: "narmada-weave", sellerKey: "textile", sku: "PAL-EMB-01", mrpPaise: 149900, sellingPricePaise: 119900, onHand: 26, weightGrams: 380, hsnCode: "6204" },
    { slug: "wool-blend-scarf", title: "Wool-blend winter scarf", summary: "Soft scarf for cool evenings and AC offices.", description: "Soft wool-blend scarf for cool evenings and air-conditioned offices. Neutral tones that layer easily over coats and kurtas. Lightweight warmth without the bulk of a shawl.", brandSlug: "narmada-weave", sellerKey: "artisan", sku: "SCF-WL-01", mrpPaise: 99900, sellingPricePaise: 79900, onHand: 50, weightGrams: 210, hsnCode: "6117" },
    { slug: "cotton-pyjama-set", title: "Cotton pyjama set", summary: "Breathable nightwear set with piping detail.", description: "Breathable cotton nightwear set with neat piping detail. Soft top-and-pant duo for humid Indian summers. Easy to wash and comfortable for nightly rest.", brandSlug: "narmada-weave", sellerKey: "fashion", sku: "PYJ-CT-01", mrpPaise: 139900, sellingPricePaise: 109900, onHand: 2, weightGrams: 400, hsnCode: "6108" },
    { slug: "rayon-wrap-dress", title: "Rayon wrap dress", summary: "Midi wrap dress with tie waist.", description: "Lightweight rayon wrap dress perfect for everyday wear. Features a flattering A-line silhouette with adjustable tie-waist. Machine-washable, travel-friendly fabric that resists wrinkles.", brandSlug: "narmada-weave", sellerKey: "mumbai", sku: "DRS-WR-01", mrpPaise: 249900, sellingPricePaise: 199900, onHand: 16, weightGrams: 360, hsnCode: "6204" },
    { slug: "kids-printed-hoodie", title: "Kids printed hoodie", summary: "Soft fleece hoodie with kangaroo pocket.", description: "Soft fleece hoodie with a kangaroo pocket in a unisex kids fit. Warm enough for school mornings and park evenings. Easy pull-on style that kids can manage themselves.", brandSlug: "little-lotus", sellerKey: "mumbai", sku: "HD-KD-01", mrpPaise: 119900, sellingPricePaise: 89900, onHand: 45, weightGrams: 340, hsnCode: "6110" },
  ]),
  ...productsFor("beauty-personal-care", [
    { slug: "herbal-face-wash-oily-skin", title: "Herbal face wash for oily skin", summary: "Gel cleanser with neem and tea tree extracts.", description: "Gel cleanser with neem and tea tree extracts for oily and combination skin. Rinses clean without stripping moisture. A refreshing daily step before moisturiser.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "FW-OL-100", mrpPaise: 34900, sellingPricePaise: 29900, onHand: 90, weightGrams: 120, hsnCode: "3304" },
    { slug: "aloe-moisturizer-tube", title: "Aloe daily moisturiser", summary: "Light gel moisturiser with aloe vera.", description: "Light aloe vera gel moisturiser made for humid climates. Non-greasy finish that absorbs quickly under sunscreen. Keeps skin comfortable from morning through commute.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "MOI-AL-50", mrpPaise: 44900, sellingPricePaise: 37900, onHand: 70, weightGrams: 80, hsnCode: "3304" },
    { slug: "coconut-hair-oil-bottle", title: "Cold-pressed coconut hair oil", summary: "200 ml bottle for weekly hair oiling.", description: "200 ml cold-pressed style coconut hair oil for weekly oiling rituals. Smooths dry ends and adds soft shine. Convenient bottle for bathroom shelves and travel kits.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "OIL-CN-200", mrpPaise: 29900, sellingPricePaise: 24900, onHand: 110, weightGrams: 220, hsnCode: "1513" },
    { slug: "charcoal-face-mask-sachets", title: "Charcoal face mask sachets", summary: "Pack of five single-use clay mask sachets.", description: "Pack of five single-use clay mask sachets for weekend pampering. Travel-friendly portions with no jar mess. Leaves skin feeling refreshed after a short sit time.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "MSK-CH-5", mrpPaise: 39900, sellingPricePaise: 32900, onHand: 60, weightGrams: 100, hsnCode: "3304" },
    { slug: "bamboo-toothbrush-twin", title: "Bamboo toothbrush twin pack", summary: "Biodegradable handles with medium bristles.", description: "Twin pack of biodegradable-handle toothbrushes with medium bristles. Practical for couples or travel kits. Soft on gums while cleaning everyday plaque.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "TB-BM-2", mrpPaise: 24900, sellingPricePaise: 19900, onHand: 150, weightGrams: 40, hsnCode: "9603" },
    { slug: "vitamin-c-serum-dropper", title: "Vitamin C serum dropper", summary: "Brightening serum in UV-protective bottle.", description: "Brightening vitamin C serum in a UV-protective dropper bottle. Lightweight texture for morning skincare layers. A cosmetic glow boost for dull-looking skin.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "SER-VC-30", mrpPaise: 79900, sellingPricePaise: 64900, onHand: 40, weightGrams: 70, hsnCode: "3304" },
    { slug: "lavender-body-lotion", title: "Lavender body lotion", summary: "Lightweight lotion for dry elbows and shins.", description: "Lightweight lavender lotion for dry elbows and shins. Pump bottle suited to humid bathroom storage. Absorbs quickly so clothes do not cling.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "LOT-LV-200", mrpPaise: 39900, sellingPricePaise: 39900, onHand: 55, weightGrams: 230, hsnCode: "3304" },
    { slug: "lip-balm-trio-tint", title: "Lip balm trio with tint", summary: "Three tinted balms in berry, nude, and clear.", description: "Three tinted balms in berry, nude, and clear for everyday lips. Pocket-sized tins that moisturise with a hint of colour. Easy to gift or share across the family.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "LIP-3", mrpPaise: 44900, sellingPricePaise: 34900, onHand: 4, weightGrams: 60, hsnCode: "3304" },
    { slug: "sandalwood-soap-bars", title: "Sandalwood soap bar trio", summary: "Handcrafted-style soap bars with mild fragrance.", description: "Handcrafted-style sandalwood soap bar trio with a mild fragrance. Gentle cleanse for daily showers. Gift-ready set for guests and festive hampers.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "SOAP-SD-3", mrpPaise: 34900, sellingPricePaise: 27900, onHand: 85, weightGrams: 300, hsnCode: "3401" },
    { slug: "makeup-blender-sponge-set", title: "Makeup blender sponge set", summary: "Set of four latex-free blending sponges.", description: "Set of four latex-free blending sponges with a travel case. Bounce foundation and concealer for an even finish. Soft when damp and easy to rinse clean.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "BLD-4", mrpPaise: 49900, sellingPricePaise: 39900, onHand: 95, weightGrams: 50, hsnCode: "9616" },
  ]),
  ...productsFor("home-kitchen", [
    { slug: "stainless-steel-airtight-container", title: "Stainless steel airtight storage container", summary: "1.5 L container with silicone gasket lid.", description: "1.5 L stainless steel dabba with a silicone gasket lid. Stackable storage for dals, snacks, and leftovers. Keeps pantry staples fresh and organised.", brandSlug: "aspera-home", sellerKey: "home", sku: "SS-AT-15", mrpPaise: 89900, sellingPricePaise: 69900, onHand: 64, weightGrams: 450, hsnCode: "7323" },
    { slug: "nonstick-dosa-tawa", title: "Non-stick dosa tawa", summary: "28 cm flat tawa with cool-touch handle.", description: "28 cm flat non-stick tawa with a cool-touch handle. Even-heat aluminium base for dosas, chillas, and parathas. Easy release with less oil for everyday breakfasts.", brandSlug: "aspera-home", sellerKey: "home", sku: "TAWA-28", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 30, weightGrams: 900, hsnCode: "7615" },
    { slug: "glass-mixing-bowl-set", title: "Glass mixing bowl set", summary: "Set of three nested borosilicate bowls.", description: "Set of three nested borosilicate bowls with lids. Microwave-safe for prep, serving, and leftover storage. Clear glass makes contents easy to spot in the fridge.", brandSlug: "aspera-home", sellerKey: "home", sku: "BWL-GL-3", mrpPaise: 149900, sellingPricePaise: 119900, onHand: 25, weightGrams: 1600, hsnCode: "7013" },
    { slug: "cotton-handloom-cushion-covers", title: "Cotton handloom cushion cover set", summary: "Set of two 16-inch cushion covers.", description: "Set of two 16-inch zippered cushion covers in an earthy handloom weave. Soft texture that refreshes sofas and reading chairs. Machine-washable covers for everyday living rooms.", brandSlug: "narmada-weave", sellerKey: "artisan", sku: "CUSH-2", mrpPaise: 99900, sellingPricePaise: 79900, onHand: 40, weightGrams: 380, hsnCode: "6304" },
    { slug: "silicone-spatula-set", title: "Silicone spatula set", summary: "Heat-resistant spatulas for non-stick pans.", description: "Heat-resistant silicone spatulas with stainless cores in three sizes. Safe for non-stick pans and mixing bowls. Flexible edges scrape batter and sauces clean.", brandSlug: "aspera-home", sellerKey: "home", sku: "SPAT-3", mrpPaise: 59900, sellingPricePaise: 44900, onHand: 70, weightGrams: 220, hsnCode: "3924" },
    { slug: "electric-kettle-1-5l", title: "Electric kettle 1.5 L", summary: "Cordless kettle with auto shut-off.", description: "Cordless 1.5 L electric kettle with auto shut-off and boil-dry protection. Fast morning chai and instant noodles without hovering. Compact base that stores neatly on kitchen counters.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "KTL-15", mrpPaise: 179900, sellingPricePaise: 149900, onHand: 20, weightGrams: 1100, hsnCode: "8516" },
    { slug: "spice-jar-carousel", title: "Spice jar carousel", summary: "Rotating rack with twelve glass jars.", description: "Rotating rack with twelve glass jars and labels included. Keeps everyday masalas within a spin’s reach. Saves cupboard clutter on busy Indian kitchen counters.", brandSlug: "aspera-home", sellerKey: "home", sku: "SPC-12", mrpPaise: 159900, sellingPricePaise: 129900, onHand: 18, weightGrams: 1400, hsnCode: "7010" },
    { slug: "cast-iron-tadka-pan", title: "Cast iron tadka pan", summary: "Pre-seasoned mini pan for tempering spices.", description: "Pre-seasoned mini cast-iron pan for tempering spices. Works on gas and induction with a diffuser plate. Builds flavour for dals, sabzis, and tadka rice.", brandSlug: "aspera-home", sellerKey: "home", sku: "TDK-CI-01", mrpPaise: 89900, sellingPricePaise: 74900, onHand: 1, weightGrams: 800, hsnCode: "7321" },
    { slug: "kitchen-knife-trio", title: "Kitchen knife trio", summary: "Chef, utility, and paring knives with sheaths.", description: "Chef, utility, and paring knives with protective sheaths. Stainless blades sized for home cooks. A ready starter set for chopping, slicing, and peeling.", brandSlug: "aspera-home", sellerKey: "home", sku: "KNF-3", mrpPaise: 219900, sellingPricePaise: 179900, onHand: 22, weightGrams: 650, hsnCode: "8211" },
    { slug: "insulated-steel-tiffin", title: "Insulated steel tiffin", summary: "Two-tier lunch box with bag.", description: "Two-tier insulated steel lunch box with a carry bag. Helps keep meals warm through office and college commutes. Leak-conscious design for rice, sabzi, and rotis.", brandSlug: "aspera-home", sellerKey: "home", sku: "TIF-2", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 35, weightGrams: 700, hsnCode: "7323" },
  ]),
  ...productsFor("electronics-accessories", [
    { slug: "wireless-neckband-type-c", title: "Wireless neckband with Type-C charging", summary: "Magnetic earbuds with 20-hour playback claim (demo).", description: "Bluetooth neckband with magnetic earbuds and Type-C charging. Comfortable for long commutes and calls. Magnetic dock keeps buds tidy when not in use.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "NB-TC-01", mrpPaise: 249900, sellingPricePaise: 179900, onHand: 48, weightGrams: 45, hsnCode: "8518" },
    { slug: "usb-c-hub-7in1", title: "USB-C hub 7-in-1", summary: "HDMI, USB-A, SD, and PD pass-through hub.", description: "USB-C hub with HDMI, USB-A, SD, and PD pass-through. Turns a slim laptop into a creator-friendly dock. Compact enough for café workdays and home desks.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "HUB-7", mrpPaise: 349900, sellingPricePaise: 279900, onHand: 27, weightGrams: 90, hsnCode: "8471" },
    { slug: "mechanical-keyboard-tkl", title: "Mechanical keyboard TKL", summary: "Hot-swappable tenkeyless keyboard.", description: "Hot-swappable tenkeyless mechanical keyboard for shared workspaces. Quieter switches that still feel responsive. Compact layout frees desk space beside your mouse.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "KB-TKL-01", mrpPaise: 599900, sellingPricePaise: 499900, onHand: 14, weightGrams: 750, hsnCode: "8471" },
    { slug: "noise-cancelling-overear", title: "Noise-cancelling over-ear headphones", summary: "Over-ear cans with foldable hinge.", description: "Over-ear headphones with foldable hinges for travel bags. Soft cushions for long listening sessions. A comfortable pick for flights, study, and focused work.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "HP-NC-01", mrpPaise: 799900, sellingPricePaise: 649900, onHand: 12, weightGrams: 280, hsnCode: "8518" },
    { slug: "webcam-1080p", title: "1080p webcam with privacy shutter", summary: "Plug-and-play webcam for video calls.", description: "Plug-and-play 1080p webcam with a privacy shutter and built-in mic. Clear video for stand-ups and online classes. Mounts easily on monitors and laptop lids.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "CAM-1080", mrpPaise: 299900, sellingPricePaise: 229900, onHand: 33, weightGrams: 120, hsnCode: "8525" },
    { slug: "portable-ssd-1tb", title: "Portable SSD 1 TB", summary: "USB-C external SSD in shock sleeve.", description: "USB-C portable SSD in a shock-resistant sleeve. Fast enough for photo backups and project folders on the go. Pocket-sized storage for creators and students.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "SSD-1T", mrpPaise: 899900, sellingPricePaise: 749900, onHand: 9, weightGrams: 60, hsnCode: "8471" },
    { slug: "led-desk-lamp-usb", title: "LED desk lamp with USB port", summary: "Dimmable lamp with phone charging port.", description: "Dimmable LED desk lamp with three colour temperatures and a USB charging port. Soft task lighting for late study sessions. Charges phones while you work.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "LAMP-USB", mrpPaise: 199900, sellingPricePaise: 159900, onHand: 40, weightGrams: 650, hsnCode: "9405" },
    { slug: "bluetooth-speaker-mini", title: "Mini Bluetooth speaker", summary: "Pocket speaker with IPX4 splash rating story.", description: "Pocket-sized Bluetooth speaker with splash-resistant housing. Punchy sound for kitchens, balconies, and travel. Long enough playtime for weekend playlists.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "SPK-MINI", mrpPaise: 199900, sellingPricePaise: 149900, onHand: 55, weightGrams: 180, hsnCode: "8518" },
    { slug: "wireless-mouse-ergonomic", title: "Ergonomic wireless mouse", summary: "Silent clicks with USB receiver.", description: "Contoured wireless mouse with silent clicks and a USB receiver. Comfortable for right-hand desk days. Smooth tracking on mats and most tabletops.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "MSE-ERG", mrpPaise: 149900, sellingPricePaise: 119900, onHand: 0, weightGrams: 95, hsnCode: "8471" },
    { slug: "laptop-stand-aluminium", title: "Aluminium laptop stand", summary: "Ventilated stand for 13–16 inch laptops.", description: "Ventilated aluminium stand for 13–16 inch laptops. Adjustable height that improves posture at home desks. Keeps devices cooler during long work stretches.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "STD-ALU", mrpPaise: 249900, sellingPricePaise: 199900, onHand: 24, weightGrams: 700, hsnCode: "8473" },
  ]),
  ...productsFor("mobile-accessories", [
    { slug: "clear-case-iphone-style", title: "Clear shockproof phone case", summary: "Universal clear case with reinforced corners.", description: "Clear shockproof case with reinforced corners for mid-size phones. Shows off your device colour while absorbing daily bumps. Precise cut-outs for ports and cameras.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "CSE-CLR", mrpPaise: 79900, sellingPricePaise: 49900, onHand: 120, weightGrams: 40, hsnCode: "3926" },
    { slug: "30w-gan-charger", title: "30W GaN dual USB-C charger", summary: "Compact wall charger for phones and earbuds.", description: "Compact 30W GaN dual USB-C wall charger with folding pins. Powers phones and earbuds from a single brick. Travel-friendly size for Indian sockets and hotel boards.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "CHG-30W", mrpPaise: 249900, sellingPricePaise: 189900, onHand: 45, weightGrams: 70, hsnCode: "8504" },
    { slug: "braided-type-c-cable-2m", title: "Braided Type-C cable 2 m", summary: "Nylon braided cable with strain relief.", description: "Nylon-braided 2 m Type-C cable with reinforced strain relief. Handles data sync and everyday charging. Extra length reaches sofas, car seats, and floor outlets.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "CBL-2M", mrpPaise: 69900, sellingPricePaise: 44900, onHand: 200, weightGrams: 55, hsnCode: "8544" },
    { slug: "magnetic-car-mount", title: "Magnetic car phone mount", summary: "Vent-clip mount with metal plates.", description: "Vent-clip magnetic phone mount with metal plates included. One-hand docking for navigation on busy roads. Stable hold that keeps maps in the driver’s line of sight.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "CAR-MAG", mrpPaise: 99900, sellingPricePaise: 69900, onHand: 60, weightGrams: 85, hsnCode: "8708" },
    { slug: "power-bank-10000mah", title: "10,000 mAh power bank", summary: "Slim power bank with dual output.", description: "Slim 10,000 mAh power bank with dual output ports. Pocketable backup for travel days and long meetings. Charges phones and earbuds without hunting for a wall point.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "PB-10K", mrpPaise: 199900, sellingPricePaise: 149900, onHand: 38, weightGrams: 220, hsnCode: "8507" },
    { slug: "tempered-glass-2pack", title: "Tempered glass 2-pack", summary: "Edge-to-edge glass with install kit.", description: "Edge-to-edge tempered glass two-pack with an install kit. Fits common 6.1–6.7 inch phones. Smooth touch feel with everyday scratch protection.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "TG-2", mrpPaise: 59900, sellingPricePaise: 39900, onHand: 150, weightGrams: 30, hsnCode: "7007" },
    { slug: "ring-light-clip", title: "Clip-on ring light", summary: "Rechargeable selfie light for creators.", description: "Rechargeable clip-on ring light with three brightness levels. Soft fill light for selfies, reels, and video calls. Clips onto phones without bulky stands.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "RING-CL", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 42, weightGrams: 110, hsnCode: "9405" },
    { slug: "wireless-charger-pad", title: "Wireless charger pad", summary: "15W max pad with LED indicator.", description: "Qi-compatible wireless charging pad with an LED status indicator. Drop-and-charge convenience for nightstands and desks. Cable-free top-ups for compatible phones.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "WLC-PAD", mrpPaise: 179900, sellingPricePaise: 129900, onHand: 5, weightGrams: 140, hsnCode: "8504" },
    { slug: "earbuds-case-cover", title: "Earbuds case silicone cover", summary: "Protective cover with carabiner.", description: "Silicone cover with carabiner for popular stem-bud cases. Adds grip and scratch protection in bags. Clip it to a keychain or backpack zipper.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "EBC-SL", mrpPaise: 49900, sellingPricePaise: 29900, onHand: 90, weightGrams: 25, hsnCode: "3926" },
    { slug: "phone-tripod-flexible", title: "Flexible phone tripod", summary: "Bendable legs with Bluetooth shutter.", description: "Bendable-leg phone tripod with a Bluetooth shutter remote. Wraps around rails and sits steady on desks. Hands-free shots for recipes, reels, and group photos.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "TRP-FLX", mrpPaise: 149900, sellingPricePaise: 109900, onHand: 33, weightGrams: 180, hsnCode: "9620" },
  ]),
  ...productsFor("health-wellness", [
    { slug: "yoga-mat-6mm", title: "Yoga mat 6 mm", summary: "Non-slip mat with carry strap.", description: "Non-slip 6 mm yoga mat with a carry strap for home practice. Cushioned enough for knees yet stable for standing poses. Rolls compactly after living-room sessions.", brandSlug: "pulse-fit", sellerKey: "sports", sku: "YG-6MM", mrpPaise: 149900, sellingPricePaise: 119900, onHand: 40, weightGrams: 1100, hsnCode: "9506" },
    { slug: "resistance-band-set", title: "Resistance band set", summary: "Five latex bands with door anchor.", description: "Five latex resistance bands with a door anchor for strength training. Beginner-friendly progression from light to firm. Packs flat for home gyms and travel workouts.", brandSlug: "pulse-fit", sellerKey: "sports", sku: "RB-5", mrpPaise: 99900, sellingPricePaise: 79900, onHand: 55, weightGrams: 400, hsnCode: "9506" },
    { slug: "copper-bottle-950ml", title: "Copper water bottle 950 ml", summary: "Leak-resistant copper bottle with lid.", description: "Leak-resistant 950 ml copper-style bottle for desks and gym bags. Classic look with everyday practicality. Easy-sip lid for hydration through long workdays.", brandSlug: "aspera-home", sellerKey: "wellness", sku: "CU-950", mrpPaise: 89900, sellingPricePaise: 69900, onHand: 48, weightGrams: 350, hsnCode: "7418" },
    { slug: "digital-weighing-scale", title: "Digital weighing scale", summary: "Tempered glass scale with LCD.", description: "Tempered-glass digital scale with a clear LCD readout. Compact footprint for bathroom wellness routines. Steady platform for daily weigh-ins.", brandSlug: "pulse-fit", sellerKey: "wellness", sku: "SCL-DIG", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 28, weightGrams: 1600, hsnCode: "8423" },
    { slug: "foam-roller-grid", title: "Grid foam roller", summary: "33 cm roller for muscle recovery.", description: "33 cm high-density foam roller for post-workout recovery. Textured surface helps release tight calves and backs. Compact length that stores under beds or sofas.", brandSlug: "pulse-fit", sellerKey: "sports", sku: "FR-33", mrpPaise: 119900, sellingPricePaise: 89900, onHand: 22, weightGrams: 500, hsnCode: "9506" },
    { slug: "herbal-green-tea-box", title: "Herbal green tea box", summary: "25 biodegradable tea bags.", description: "Box of 25 biodegradable green tea bags for evening wind-downs. Mild brew that pairs with light snacks. Convenient pantry staple for daily tea rituals.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "TEA-GR-25", mrpPaise: 34900, sellingPricePaise: 29900, onHand: 100, weightGrams: 80, hsnCode: "0902" },
    { slug: "posture-corrector-brace", title: "Posture corrector brace", summary: "Adjustable upper-back support brace.", description: "Adjustable upper-back support brace for desk workers. Soft straps that remind you to sit taller. Breathable enough for long laptop sessions.", brandSlug: "pulse-fit", sellerKey: "wellness", sku: "PST-01", mrpPaise: 99900, sellingPricePaise: 74900, onHand: 35, weightGrams: 150, hsnCode: "9021" },
    { slug: "sleep-eye-mask-silk", title: "Silk-feel sleep eye mask", summary: "Contoured mask with adjustable strap.", description: "Contoured silk-feel sleep mask with an adjustable strap. Blocks light for flights, naps, and early bedtimes. Soft against skin without pressing on lashes.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "EYE-SL", mrpPaise: 59900, sellingPricePaise: 44900, onHand: 70, weightGrams: 40, hsnCode: "6307" },
    { slug: "jump-rope-bearing", title: "Bearing jump rope", summary: "Adjustable rope with comfortable grips.", description: "Adjustable bearing jump rope with comfortable grips. Smooth spins for home cardio and warm-ups. Length trims to fit most heights.", brandSlug: "pulse-fit", sellerKey: "sports", sku: "JR-BR", mrpPaise: 69900, sellingPricePaise: 49900, onHand: 60, weightGrams: 200, hsnCode: "9506" },
    { slug: "wellness-draft-supplement", title: "Draft herbal gummies (unpublished)", summary: "Draft listing to test seller catalogue moderation.", description: "Herbal gummy listing awaiting seller moderation. Not customer-visible until approved. Reserved for catalogue workflow testing only.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "DRF-GUM", mrpPaise: 79900, sellingPricePaise: 69900, onHand: 20, weightGrams: 150, hsnCode: "2106", status: "draft" },
    { slug: "cork-yoga-mat-strap", title: "Cork yoga mat with strap", summary: "Natural cork top mat with cotton carry strap.", description: "Natural cork-top yoga mat with a cotton carry strap. Grippy surface that improves as you practise. Extra-stable feel for hot rooms and barefoot flows.", brandSlug: "pulse-fit", sellerKey: "sports", sku: "YG-CORK", mrpPaise: 249900, sellingPricePaise: 199900, onHand: 18, weightGrams: 1300, hsnCode: "9506" },
  ]),
  ...productsFor("baby-kids", [
    { slug: "organic-cotton-onesie", title: "Organic cotton onesie", summary: "Snap-button onesie for newborns.", description: "Snap-button organic cotton onesie for newborns. Soft jersey gentle on sensitive skin. Easy nappy changes with secure snaps along the inseam.", brandSlug: "little-lotus", sellerKey: "fashion", sku: "ONE-NB", mrpPaise: 79900, sellingPricePaise: 59900, onHand: 40, weightGrams: 120, hsnCode: "6111" },
    { slug: "silicone-bib-catcher", title: "Silicone bib with catcher", summary: "Wipe-clean bib for weaning.", description: "Wipe-clean silicone bib with a food catcher for weaning. Adjustable neck that grows with your little one. Soft enough for daily mealtimes and travel high chairs.", brandSlug: "little-lotus", sellerKey: "home", sku: "BIB-SL", mrpPaise: 49900, sellingPricePaise: 39900, onHand: 65, weightGrams: 90, hsnCode: "3924" },
    { slug: "wooden-stacking-rings", title: "Wooden stacking rings", summary: "Classic stacking toy with smooth finish.", description: "Classic wooden stacking rings with a smooth painted finish. Encourages colour recognition and hand coordination. A timeless toddler toy for play mats and shelves.", brandSlug: "little-lotus", sellerKey: "home", sku: "TOY-RG", mrpPaise: 89900, sellingPricePaise: 69900, onHand: 30, weightGrams: 400, hsnCode: "9503" },
    { slug: "kids-stainless-bottle", title: "Kids stainless bottle 400 ml", summary: "Leak-resistant bottle with straw lid.", description: "Leak-resistant 400 ml stainless bottle with a straw lid. School-bag friendly size for water and diluted juices. Durable build that survives daily drops.", brandSlug: "little-lotus", sellerKey: "home", sku: "BTL-KD", mrpPaise: 79900, sellingPricePaise: 64900, onHand: 50, weightGrams: 220, hsnCode: "7323" },
    { slug: "muslin-swaddle-set", title: "Muslin swaddle set", summary: "Set of three breathable swaddles.", description: "Set of three breathable muslin swaddles for sleep and tummy time. Soft cotton that layers without overheating. Multi-use cloths for nursing covers and pram shade.", brandSlug: "little-lotus", sellerKey: "fashion", sku: "SWA-3", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 28, weightGrams: 300, hsnCode: "6301" },
    { slug: "soft-book-crinkle", title: "Crinkle soft book", summary: "Fabric book with high-contrast pages.", description: "Fabric book with high-contrast pages and gentle crinkle sounds. Engaging for tummy-time and seated play. Soft edges safe for little hands.", brandSlug: "little-lotus", sellerKey: "home", sku: "BOOK-CR", mrpPaise: 59900, sellingPricePaise: 44900, onHand: 45, weightGrams: 80, hsnCode: "9503" },
    { slug: "kids-raincoat-packable", title: "Packable kids raincoat", summary: "Lightweight raincoat with pouch.", description: "Lightweight kids raincoat that packs into its own pouch. Essential monsoon cover for school runs. Easy zip front kids can manage with help.", brandSlug: "little-lotus", sellerKey: "fashion", sku: "RAIN-KD", mrpPaise: 119900, sellingPricePaise: 89900, onHand: 20, weightGrams: 250, hsnCode: "6201" },
    { slug: "baby-nail-care-kit", title: "Baby nail care kit", summary: "Rounded clippers and file in case.", description: "Rounded baby clippers and file in a protective case. Gentle grooming tools sized for tiny nails. Compact kit for home and travel diaper bags.", brandSlug: "little-lotus", sellerKey: "wellness", sku: "NAIL-BB", mrpPaise: 39900, sellingPricePaise: 29900, onHand: 70, weightGrams: 50, hsnCode: "8214" },
    { slug: "plush-elephant-soft-toy", title: "Plush elephant soft toy", summary: "Embroidered-eye plush for cuddles.", description: "Embroidered-eye plush elephant for cuddles and naps. Soft body with a machine-washable cover story parents trust. Friendly size for cribs and toddler beds.", brandSlug: "little-lotus", sellerKey: "home", sku: "PLUSH-EL", mrpPaise: 99900, sellingPricePaise: 79900, onHand: 35, weightGrams: 280, hsnCode: "9503" },
    { slug: "kids-tableware-set", title: "Kids bamboo tableware set", summary: "Plate, bowl, and spoon set.", description: "Bamboo-feel plate, bowl, and spoon set with sectioned plate. Helps picky eaters keep foods apart. Lightweight pieces for first self-feeding adventures.", brandSlug: "little-lotus", sellerKey: "home", sku: "TBW-KD", mrpPaise: 89900, sellingPricePaise: 69900, onHand: 3, weightGrams: 320, hsnCode: "4419" },
  ]),
  ...productsFor("stationery-office", [
    { slug: "dotted-notebook-a5", title: "Dotted notebook A5", summary: "192-page dotted journal with elastic band.", description: "192-page A5 dotted journal with an elastic band closure. Ivory paper that works with pens and pencils. Ideal for notes, planners, and creative sketches.", brandSlug: "ink-and-quill", sellerKey: "home", sku: "NB-A5-D", mrpPaise: 49900, sellingPricePaise: 39900, onHand: 80, weightGrams: 280, hsnCode: "4820" },
    { slug: "bamboo-desk-organizer", title: "Bamboo desk organiser", summary: "Multi-compartment organiser for pens and sticky notes.", description: "Multi-compartment bamboo organiser for pens and sticky notes. Natural finish that warms home-office desks. Keeps everyday stationery within easy reach.", brandSlug: "ink-and-quill", sellerKey: "home", sku: "ORG-BM", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 25, weightGrams: 600, hsnCode: "4420" },
    { slug: "gel-pen-set-12", title: "Gel pen set of 12", summary: "Smooth 0.5 mm gel pens in assorted colours.", description: "Smooth 0.5 mm gel pens in twelve assorted colours. Reliable ink for students and office notes. Comfortable barrels for long writing sessions.", brandSlug: "ink-and-quill", sellerKey: "home", sku: "PEN-12", mrpPaise: 34900, sellingPricePaise: 24900, onHand: 150, weightGrams: 120, hsnCode: "9608" },
    { slug: "sticky-notes-pastel-pack", title: "Pastel sticky notes pack", summary: "Five pads in soft pastel colours.", description: "Five pastel sticky-note pads with about seventy sheets each. Soft colours that brighten planners and monitors. Handy for reminders across home and office.", brandSlug: "ink-and-quill", sellerKey: "home", sku: "STK-5", mrpPaise: 29900, sellingPricePaise: 19900, onHand: 200, weightGrams: 150, hsnCode: "4820" },
    { slug: "accordion-file-folder", title: "Accordion file folder", summary: "13-pocket expanding file for A4 documents.", description: "Thirteen-pocket expanding file for A4 documents with elastic closure. Keeps bills, school papers, and contracts sorted. Sturdy enough for monthly filing routines.", brandSlug: "ink-and-quill", sellerKey: "home", sku: "FILE-13", mrpPaise: 59900, sellingPricePaise: 44900, onHand: 40, weightGrams: 350, hsnCode: "4820" },
    { slug: "whiteboard-starter-kit", title: "Whiteboard starter kit", summary: "Markers, eraser, and cleaner spray.", description: "Markers, eraser, and cleaner spray for home-office boards. Quick brainstorm kit for families and remote teams. Refill-friendly colours for everyday planning.", brandSlug: "ink-and-quill", sellerKey: "home", sku: "WB-KIT", mrpPaise: 79900, sellingPricePaise: 59900, onHand: 30, weightGrams: 400, hsnCode: "9608" },
    { slug: "planner-undated-weekly", title: "Undated weekly planner", summary: "Hardcover weekly planner without year lock-in.", description: "Hardcover undated weekly planner with goal pages included. Start any week without wasting dated spreads. Clean layout for work, study, and household lists.", brandSlug: "ink-and-quill", sellerKey: "home", sku: "PLN-WK", mrpPaise: 69900, sellingPricePaise: 54900, onHand: 55, weightGrams: 320, hsnCode: "4820" },
    { slug: "desk-scissors-titanium", title: "Titanium-coated desk scissors", summary: "8-inch scissors with soft grip.", description: "Eight-inch titanium-coated desk scissors with soft grip handles. Clean cuts through paper and light craft stock. Everyday office essential for home desks.", brandSlug: "ink-and-quill", sellerKey: "home", sku: "SCS-8", mrpPaise: 44900, sellingPricePaise: 34900, onHand: 70, weightGrams: 90, hsnCode: "8213" },
    { slug: "cable-clips-desktop", title: "Desktop cable clips pack", summary: "Pack of ten adhesive cable organisers.", description: "Pack of ten adhesive cable clips for chargers and headphones. Keeps desk edges tidy and cords findable. Stick-and-hold design for wood and laminate surfaces.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "CLP-10", mrpPaise: 29900, sellingPricePaise: 19900, onHand: 0, weightGrams: 40, hsnCode: "3926" },
    { slug: "label-maker-handheld", title: "Handheld label maker", summary: "QWERTY label printer for home filing.", description: "Handheld QWERTY label maker for home filing and kitchen jars. Includes starter tape to get organised right away. Clear labels that make storage easy to scan.", brandSlug: "silicon-bay", sellerKey: "tech", sku: "LBL-HH", mrpPaise: 299900, sellingPricePaise: 249900, onHand: 15, weightGrams: 350, hsnCode: "8472" },
  ]),
  ...productsFor("sports-fitness", [
    { slug: "lightweight-running-shoes", title: "Lightweight running shoes", summary: "Breathable mesh trainers for daily runs.", description: "Breathable mesh trainers with cushioned midsoles for daily runs. Lightweight feel for park loops and treadmill sessions. Secure lace-up fit for everyday training.", brandSlug: "trailmark", sellerKey: "sports", sku: "RUN-LT", mrpPaise: 399900, sellingPricePaise: 329900, onHand: 24, weightGrams: 550, hsnCode: "6404" },
    { slug: "adjustable-dumbbell-pair", title: "Adjustable dumbbell pair", summary: "Pair of dial dumbbells for home gyms.", description: "Pair of dial-style adjustable dumbbells for compact home gyms. Swap loads without a full weight rack. Stable grips for presses, rows, and curls.", brandSlug: "pulse-fit", sellerKey: "sports", sku: "DB-ADJ", mrpPaise: 899900, sellingPricePaise: 749900, onHand: 8, weightGrams: 12000, hsnCode: "9506" },
    { slug: "gym-duffel-bag", title: "Gym duffel bag", summary: "Water-resistant duffel with shoe pocket.", description: "Water-resistant gym duffel with a dedicated shoe pocket. Separates trainers from clean clothes after workouts. Weekend and gym carry in one sturdy bag.", brandSlug: "trailmark", sellerKey: "sports", sku: "DFL-GYM", mrpPaise: 199900, sellingPricePaise: 159900, onHand: 30, weightGrams: 600, hsnCode: "4202" },
    { slug: "protein-shaker-bottle", title: "Protein shaker bottle", summary: "700 ml shaker with mixing ball.", description: "700 ml shaker bottle with a mixing ball and leak-resistant lid. Smooth shakes for post-workout routines. Wide mouth that rinses clean quickly.", brandSlug: "pulse-fit", sellerKey: "wellness", sku: "SHK-700", mrpPaise: 49900, sellingPricePaise: 34900, onHand: 90, weightGrams: 150, hsnCode: "3924" },
    { slug: "sports-water-bottle-insulated", title: "Insulated sports bottle 750 ml", summary: "Double-wall bottle that keeps drinks cold.", description: "Double-wall 750 ml bottle that keeps drinks cold on the move. Sweat-proof exterior for gym bags and desks. Easy-sip lid for training and commute days.", brandSlug: "trailmark", sellerKey: "wellness", sku: "BTL-750", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 40, weightGrams: 320, hsnCode: "9617" },
    { slug: "ankle-weights-pair", title: "Ankle weights pair", summary: "Adjustable ankle weights for walks.", description: "Adjustable ankle weights with secure Velcro straps. Add gentle resistance to walks and mat workouts. Comfortable fit for home fitness routines.", brandSlug: "pulse-fit", sellerKey: "wellness", sku: "ANK-WT", mrpPaise: 149900, sellingPricePaise: 119900, onHand: 20, weightGrams: 2000, hsnCode: "9506" },
    { slug: "yoga-block-pair", title: "Yoga block pair", summary: "EVA foam blocks for alignment support.", description: "EVA foam yoga blocks with bevelled edges for alignment support. Helpful for beginners deepening stretches safely. Light enough to pack with your mat.", brandSlug: "pulse-fit", sellerKey: "wellness", sku: "YB-2", mrpPaise: 79900, sellingPricePaise: 59900, onHand: 50, weightGrams: 400, hsnCode: "9506" },
    { slug: "cycling-gloves-gel", title: "Gel-padded cycling gloves", summary: "Touchscreen-compatible finger tips.", description: "Gel-padded cycling gloves with touchscreen-compatible fingertips. Cushioned palms for road and indoor rides. Breathable backs that reduce sweaty grip slip.", brandSlug: "trailmark", sellerKey: "fashion", sku: "GLV-CYC", mrpPaise: 99900, sellingPricePaise: 79900, onHand: 35, weightGrams: 80, hsnCode: "6116" },
    { slug: "agility-ladder", title: "Agility ladder", summary: "Adjustable rungs for footwork drills.", description: "Adjustable-rung agility ladder with a carry bag. Footwork drills for speed and coordination. Sets up quickly on terraces, parks, and indoor courts.", brandSlug: "pulse-fit", sellerKey: "sports", sku: "AGL-LD", mrpPaise: 119900, sellingPricePaise: 89900, onHand: 18, weightGrams: 500, hsnCode: "9506" },
    { slug: "sports-submitted-knee-sleeve", title: "Submitted knee sleeve (moderation)", summary: "Compression knee sleeve awaiting approval.", description: "Compression knee sleeve submitted for catalogue approval. Supportive fit for light training days. Not public on the storefront until reviewed.", brandSlug: "pulse-fit", sellerKey: "wellness", sku: "KNE-SUB", mrpPaise: 89900, sellingPricePaise: 69900, onHand: 25, weightGrams: 100, hsnCode: "6307", status: "submitted" },
    { slug: "hybrid-training-shorts", title: "Hybrid training shorts", summary: "Quick-dry shorts with zip pocket.", description: "Quick-dry training shorts with a secure zip pocket. Flexible fabric for gym, run, and stretch sessions. Comfortable inseam for everyday active wear.", brandSlug: "trailmark", sellerKey: "sports", sku: "SHT-TR", mrpPaise: 149900, sellingPricePaise: 119900, onHand: 36, weightGrams: 220, hsnCode: "6103" },
  ]),
  ...productsFor("bags-footwear", [
    { slug: "leatherette-sling-bag", title: "Leatherette sling bag", summary: "Crossbody sling with adjustable strap.", description: "Crossbody leatherette sling with an adjustable strap. Compact everyday city bag for phone, wallet, and keys. Soft structure that sits close without bulk.", brandSlug: "trailmark", sellerKey: "mumbai", sku: "SLG-LT", mrpPaise: 149900, sellingPricePaise: 119900, onHand: 32, weightGrams: 350, hsnCode: "4202" },
    { slug: "canvas-backpack-laptop", title: "Canvas laptop backpack", summary: "Padded 15-inch sleeve backpack.", description: "Canvas backpack with a padded 15-inch laptop sleeve. Water-resistant base for rainy commute days. Organised pockets for chargers, bottles, and notebooks.", brandSlug: "trailmark", sellerKey: "mumbai", sku: "BP-CV", mrpPaise: 249900, sellingPricePaise: 199900, onHand: 20, weightGrams: 700, hsnCode: "4202" },
    { slug: "kolhapuri-style-sandals", title: "Kolhapuri-style sandals", summary: "Hand-finish inspired flat sandals.", description: "Hand-finish inspired flat sandals for everyday ethnic wear. Comfortable sole for markets and festive daytime outings. Classic look that pairs with kurtas and dresses.", brandSlug: "narmada-weave", sellerKey: "artisan", sku: "SND-KH", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 28, weightGrams: 400, hsnCode: "6403" },
    { slug: "memory-foam-slippers", title: "Memory foam house slippers", summary: "Closed-toe slippers with soft sole.", description: "Closed-toe house slippers with memory-foam cushioning. Soft indoor comfort after long workdays. Easy slip-on style for bedrooms and balconies.", brandSlug: "aspera-home", sellerKey: "home", sku: "SLP-MF", mrpPaise: 89900, sellingPricePaise: 69900, onHand: 45, weightGrams: 300, hsnCode: "6404" },
    { slug: "weekender-duffel", title: "Weekender duffel", summary: "Soft-sided duffel for short trips.", description: "Soft-sided weekender duffel with a shoe compartment. Packs outfits for short trips without a hard suitcase. Comfortable shoulder carry for trains and cabs.", brandSlug: "trailmark", sellerKey: "mumbai", sku: "DFL-WK", mrpPaise: 299900, sellingPricePaise: 249900, onHand: 14, weightGrams: 800, hsnCode: "4202" },
    { slug: "canvas-tote-market", title: "Heavy canvas market tote", summary: "Open tote with interior pocket.", description: "Heavy canvas open tote with an interior pocket. Sturdy enough for groceries, books, and market hauls. Washes well and softens with use.", brandSlug: "narmada-weave", sellerKey: "fashion", sku: "TOTE-HV", mrpPaise: 79900, sellingPricePaise: 59900, onHand: 60, weightGrams: 280, hsnCode: "4202" },
    { slug: "running-socks-3pack", title: "Running socks 3-pack", summary: "Cushioned ankle socks with arch support.", description: "Cushioned ankle running socks with arch support in a three-pack. Moisture-wicking comfort for daily training. Stay-put cuffs that do not slide mid-run.", brandSlug: "trailmark", sellerKey: "fashion", sku: "SOX-3", mrpPaise: 69900, sellingPricePaise: 49900, onHand: 100, weightGrams: 120, hsnCode: "6115" },
    { slug: "formal-belt-reversible", title: "Reversible formal belt", summary: "Black/brown reversible belt with boxed buckle.", description: "Black and brown reversible formal belt with a boxed buckle. One belt covering two office outfits. Smooth finish that pairs with formals and smart casuals.", brandSlug: "narmada-weave", sellerKey: "textile", sku: "BLT-RV", mrpPaise: 99900, sellingPricePaise: 79900, onHand: 40, weightGrams: 150, hsnCode: "4203" },
    { slug: "kids-velcro-sneakers", title: "Kids velcro sneakers", summary: "Easy-on sneakers for school days.", description: "Easy-on velcro sneakers for school days. Breathable upper that keeps little feet comfortable. Secure fit kids can fasten with minimal help.", brandSlug: "little-lotus", sellerKey: "fashion", sku: "SNK-KD", mrpPaise: 149900, sellingPricePaise: 119900, onHand: 22, weightGrams: 320, hsnCode: "6404" },
    { slug: "travel-packing-cubes", title: "Travel packing cubes set", summary: "Set of four cubes for organised packing.", description: "Set of four packing cubes with mesh tops for organised travel. Separate clothes by day or category in any suitcase. Compress soft items for more bag space.", brandSlug: "trailmark", sellerKey: "fashion", sku: "CUBE-4", mrpPaise: 129900, sellingPricePaise: 99900, onHand: 2, weightGrams: 280, hsnCode: "4202" },
  ]),
  ...productsFor("household-essentials", [
    { slug: "floor-cleaner-citrus", title: "Citrus floor cleaner 1 L", summary: "Concentrated cleaner for tile floors.", description: "Concentrated citrus floor cleaner for tile and marble homes. Dilutable formula that leaves floors smelling fresh. Everyday mopping staple in a convenient litre pack.", brandSlug: "aspera-home", sellerKey: "home", sku: "CLN-FL-1L", mrpPaise: 24900, sellingPricePaise: 19900, onHand: 120, weightGrams: 1100, hsnCode: "3402" },
    { slug: "dishwash-liquid-refill", title: "Dishwash liquid refill 1.5 L", summary: "Lemon dishwash refill pouch.", description: "1.5 L lemon dishwash refill pouch that cuts plastic versus bottles. Cuts grease on steel and ceramic plates. Economical top-up for busy kitchen sinks.", brandSlug: "aspera-home", sellerKey: "home", sku: "DSH-15", mrpPaise: 29900, sellingPricePaise: 24900, onHand: 90, weightGrams: 1550, hsnCode: "3402" },
    { slug: "garbage-bags-medium", title: "Medium garbage bags roll", summary: "30-bag roll with easy-tie flaps.", description: "Thirty-bag roll of medium kitchen garbage bags with easy-tie flaps. Fits common household bins without tearing. Everyday utility pack for apartments.", brandSlug: "aspera-home", sellerKey: "home", sku: "BAG-M-30", mrpPaise: 19900, sellingPricePaise: 14900, onHand: 200, weightGrams: 400, hsnCode: "3923" },
    { slug: "microfiber-mop-refill", title: "Microfibre mop refill pad", summary: "Washable pad compatible with flat mops.", description: "Washable microfibre refill pad compatible with flat mops. Velcro attach for quick swaps mid-clean. Machine-washable pad that replaces disposable sheets.", brandSlug: "aspera-home", sellerKey: "home", sku: "MOP-RF", mrpPaise: 34900, sellingPricePaise: 27900, onHand: 75, weightGrams: 120, hsnCode: "6307" },
    { slug: "glass-cleaner-spray", title: "Glass cleaner spray 500 ml", summary: "Streak-free spray for windows and mirrors.", description: "500 ml streak-free spray for windows, mirrors, and glass tables. Trigger bottle ready for quick shine-ups. Everyday clarity without heavy residue.", brandSlug: "aspera-home", sellerKey: "home", sku: "GLS-500", mrpPaise: 19900, sellingPricePaise: 19900, onHand: 85, weightGrams: 550, hsnCode: "3402" },
    { slug: "laundry-detergent-pods", title: "Laundry detergent pods", summary: "Pack of twenty dissolvable pods.", description: "Pack of twenty dissolvable laundry pods for front-load machines. Pre-measured cleaning without messy scoops. Convenient for weekly wash days.", brandSlug: "aspera-home", sellerKey: "home", sku: "DET-20", mrpPaise: 44900, sellingPricePaise: 37900, onHand: 60, weightGrams: 500, hsnCode: "3402" },
    { slug: "toilet-cleaner-thick", title: "Thick toilet cleaner 500 ml", summary: "Angled-neck bottle for under-rim cleaning.", description: "Thick toilet cleaner in an angled-neck 500 ml bottle. Reaches under the rim for thorough cleans. Household hygiene essential for weekly routines.", brandSlug: "aspera-home", sellerKey: "home", sku: "TLT-500", mrpPaise: 14900, sellingPricePaise: 11900, onHand: 110, weightGrams: 560, hsnCode: "3402" },
    { slug: "scrub-pads-multipack", title: "Scrub pads multipack", summary: "Pack of six dual-side scrubbers.", description: "Pack of six dual-side scrubbers for pots and pans. Tough scrub face with a softer wipe side. Kitchen sink staple that lasts through daily cooking.", brandSlug: "aspera-home", sellerKey: "home", sku: "SCR-6", mrpPaise: 14900, sellingPricePaise: 9900, onHand: 180, weightGrams: 100, hsnCode: "6805" },
    { slug: "room-freshener-gel", title: "Room freshener gel can", summary: "Long-lasting gel fragrance for living rooms.", description: "Long-lasting gel freshener can for living rooms and bathrooms. Soft fragrance that refreshes small spaces. Set-and-forget freshness between deep cleans.", brandSlug: "coastal-bloom", sellerKey: "wellness", sku: "FRS-GEL", mrpPaise: 24900, sellingPricePaise: 19900, onHand: 70, weightGrams: 200, hsnCode: "3307" },
    { slug: "dustpan-broom-compact", title: "Compact dustpan and broom", summary: "Standing dustpan set for quick clean-ups.", description: "Standing dustpan and broom set sized for apartments. Quick clean-ups for crumbs and balcony dust. Compact storage that does not clutter utility corners.", brandSlug: "aspera-home", sellerKey: "home", sku: "DPS-SET", mrpPaise: 39900, sellingPricePaise: 29900, onHand: 4, weightGrams: 450, hsnCode: "9603" },
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
