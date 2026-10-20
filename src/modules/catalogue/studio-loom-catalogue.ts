/**
 * Ten listings for the Studio Loom seller account.
 * Photos are Unsplash URLs already allowed by the image optimizer and CSP.
 */
export const STUDIO_LOOM_SELLER = {
  email: "studio.loom@aspera.local",
  password: "AsperaStudioDevOnly1!",
  displayName: "Studio Loom",
  legalName: "Studio Loom Traders Private Limited",
  tradeName: "Studio Loom",
  contactEmail: "studio.loom.ops@aspera.local",
  contactPhone: "9845012340",
  pan: "STUDB1234F",
  gstin: "29STUDB1234F1Z5",
  registeredState: "Karnataka",
} as const;

export type StudioLoomProduct = {
  sku: string;
  title: string;
  summary: string;
  description: string;
  categorySlug: string;
  variantTitle: string;
  mrpPaise: number;
  sellingPricePaise: number;
  initialStock: number;
  weightGrams: number;
  hsnCode: string;
  imageUrl: string;
};

const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

export const STUDIO_LOOM_PRODUCTS: StudioLoomProduct[] = [
  {
    sku: "SLM-STOLE-01",
    title: "Studio Loom handloom cotton stole",
    summary: "Light handloom cotton stole for kurtas and everyday layering.",
    description:
      "A breathable handloom cotton stole with a soft drape for warm days and air-conditioned rooms. The weave sits lightly on the shoulder and folds small enough for a bag. Wash cold and line dry to keep the handloom texture.",
    categorySlug: "fashion",
    variantTitle: "Natural",
    mrpPaise: 129900,
    sellingPricePaise: 89900,
    initialStock: 36,
    weightGrams: 180,
    hsnCode: "6214",
    imageUrl: photo("photo-1594938298603-c8148c4dae35"),
  },
  {
    sku: "SLM-DUPATTA-01",
    title: "Studio Loom mulmul cotton dupatta",
    summary: "Sheer mulmul dupatta with a narrow border for festive casual wear.",
    description:
      "Lightweight mulmul cotton dupatta that drapes without bulk over kurtas and dresses. A narrow border keeps the look neat for office and family gatherings. Gentle wash recommended so the weave stays airy.",
    categorySlug: "fashion",
    variantTitle: "Ivory",
    mrpPaise: 99900,
    sellingPricePaise: 74900,
    initialStock: 28,
    weightGrams: 140,
    hsnCode: "6214",
    imageUrl: photo("photo-1490481651871-ab68de25d43d"),
  },
  {
    sku: "SLM-DIYA-01",
    title: "Studio Loom brass diya pair",
    summary: "Pair of small brass diyas for puja shelves and festive evenings.",
    description:
      "A pair of compact brass diyas sized for puja thalis and window ledges. The metal takes a warm polish and the cups hold a standard cotton wick. Wipe dry after use to keep the brass bright.",
    categorySlug: "home-kitchen",
    variantTitle: "Pair",
    mrpPaise: 79900,
    sellingPricePaise: 59900,
    initialStock: 40,
    weightGrams: 260,
    hsnCode: "7418",
    imageUrl: photo("photo-1600585154340-be6161a56a0c"),
  },
  {
    sku: "SLM-COMB-01",
    title: "Studio Loom neem wood comb",
    summary: "Wide-tooth neem wood comb for detangling damp hair.",
    description:
      "Hand-finished neem wood comb with wide teeth that glide through damp hair without snagging. The smooth spine is comfortable for daily detangling. Keep it dry between uses so the wood does not swell.",
    categorySlug: "beauty-personal-care",
    variantTitle: "Wide tooth",
    mrpPaise: 34900,
    sellingPricePaise: 24900,
    initialStock: 80,
    weightGrams: 45,
    hsnCode: "9615",
    imageUrl: photo("photo-1522335789203-aabd1fc54bc9"),
  },
  {
    sku: "SLM-DABBA-01",
    title: "Studio Loom steel lunch dabba",
    summary: "Two-tier stainless dabba with a leak-resistant clasp.",
    description:
      "Two-tier stainless steel lunch dabba for office and school tiffins. The clasp keeps dal and sabzi from spilling in a bag, and the steel is easy to wash without holding odour. Fits a standard lunch portion for one.",
    categorySlug: "home-kitchen",
    variantTitle: "Two tier",
    mrpPaise: 149900,
    sellingPricePaise: 119900,
    initialStock: 22,
    weightGrams: 640,
    hsnCode: "7323",
    imageUrl: photo("photo-1556911220-e15b29be8c8f"),
  },
  {
    sku: "SLM-CUSHION-01",
    title: "Studio Loom block-print cushion cover",
    summary: "Cotton cushion cover with a block-print border, 16 inch.",
    description:
      "Cotton cushion cover with a block-print border sized for a 16 inch insert. The cover has a concealed flap so the insert stays hidden on a sofa or diwan. Machine wash cold and iron on the reverse.",
    categorySlug: "home-kitchen",
    variantTitle: "16 inch",
    mrpPaise: 89900,
    sellingPricePaise: 64900,
    initialStock: 30,
    weightGrams: 220,
    hsnCode: "6304",
    imageUrl: photo("photo-1493666438817-866a91353ca9"),
  },
  {
    sku: "SLM-BOTTLE-01",
    title: "Studio Loom copper water bottle",
    summary: "750 ml copper bottle for the desk and commute.",
    description:
      "A 750 ml copper water bottle with a leak-resistant cap for desks and commutes. The slim body fits a backpack side pocket. Rinse and dry the interior so the copper stays clean between fills.",
    categorySlug: "home-kitchen",
    variantTitle: "750 ml",
    mrpPaise: 119900,
    sellingPricePaise: 89900,
    initialStock: 24,
    weightGrams: 380,
    hsnCode: "7418",
    imageUrl: photo("photo-1602143407151-7111542de6e8"),
  },
  {
    sku: "SLM-TOWEL-01",
    title: "Studio Loom cotton face towel trio",
    summary: "Pack of three soft cotton face towels.",
    description:
      "Three compact cotton face towels for the bathroom and travel pouch. The weave softens after the first wash and dries quickly on a rail. Colour-fast dyes suited to regular machine washing.",
    categorySlug: "household-essentials",
    variantTitle: "Pack of 3",
    mrpPaise: 59900,
    sellingPricePaise: 44900,
    initialStock: 50,
    weightGrams: 280,
    hsnCode: "6302",
    imageUrl: photo("photo-1582735689369-4fe89db7114c"),
  },
  {
    sku: "SLM-TOTE-01",
    title: "Studio Loom jute market tote",
    summary: "Sturdy jute tote with cotton handles for market runs.",
    description:
      "A roomy jute market tote with cotton handles that sit comfortably on the shoulder. It carries vegetables, books, or a laptop sleeve without stretching out of shape. Spot clean and air dry to keep the jute firm.",
    categorySlug: "bags-footwear",
    variantTitle: "Natural jute",
    mrpPaise: 79900,
    sellingPricePaise: 54900,
    initialStock: 32,
    weightGrams: 420,
    hsnCode: "4202",
    imageUrl: photo("photo-1544816155-12df9643f363"),
  },
  {
    sku: "SLM-JARS-01",
    title: "Studio Loom ceramic spice jar set",
    summary: "Set of four ceramic jars with cork lids for the masala shelf.",
    description:
      "Four small ceramic spice jars with cork lids for turmeric, chilli, cumin, and coriander. The wide mouth makes a teaspoon easy, and the cork keeps moisture out of the masala. Hand wash the jars and dry the lids fully.",
    categorySlug: "home-kitchen",
    variantTitle: "Set of 4",
    mrpPaise: 169900,
    sellingPricePaise: 129900,
    initialStock: 18,
    weightGrams: 980,
    hsnCode: "6912",
    imageUrl: photo("photo-1596040033229-a9821ebd058d"),
  },
];
