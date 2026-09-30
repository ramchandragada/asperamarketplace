import type { SeedCategoryDef, SeedProductDef } from "./seed-catalogue-data";

type BrandRef = { slug: SeedProductDef["brandSlug"]; name: string };

const STYLES = [
  "everyday",
  "festive",
  "travel",
  "compact",
  "classic",
  "soft",
  "daily",
  "weekend",
  "family",
  "studio",
  "light",
  "essential",
] as const;

type Lane = {
  href: string;
  categorySlug?: string;
  q?: string;
  audience?: SeedProductDef["audience"];
  maxPricePaise?: number;
  minDiscountPercent?: number;
};

function parseHref(href: string): Lane {
  const url = new URL(href, "http://storefront.local");
  const audienceRaw = url.searchParams.get("audience") ?? undefined;
  const audience =
    audienceRaw === "women" ||
    audienceRaw === "men" ||
    audienceRaw === "kids" ||
    audienceRaw === "unisex"
      ? audienceRaw
      : undefined;
  const maxRaw = url.searchParams.get("maxPricePaise");
  const discountRaw = url.searchParams.get("minDiscountPercent");
  return {
    href,
    categorySlug: url.searchParams.get("categorySlug") ?? undefined,
    q: url.searchParams.get("q")?.trim() || undefined,
    audience,
    maxPricePaise: maxRaw ? Number(maxRaw) : undefined,
    minDiscountPercent: discountRaw ? Number(discountRaw) : undefined,
  };
}

function discountPercent(item: SeedProductDef) {
  if (item.mrpPaise <= item.sellingPricePaise) return 0;
  return Math.round(
    ((item.mrpPaise - item.sellingPricePaise) / item.mrpPaise) * 100,
  );
}

function matchesQuery(
  item: SeedProductDef,
  q: string | undefined,
  categoryName: string,
  brandName: string,
) {
  if (!q) return true;
  const needle = q.toLowerCase();
  const titleSummary = `${item.title} ${item.summary}`.toLowerCase();
  if (titleSummary.includes(needle)) return true;
  const blob = `${titleSummary} ${categoryName} ${brandName}`.toLowerCase();
  return needle.split(/\s+/).every((word) => blob.includes(word));
}

export function catalogueMatchCount(
  products: SeedProductDef[],
  href: string,
  categories: SeedCategoryDef[],
  brands: readonly BrandRef[],
) {
  const lane = parseHref(href);
  const categoryName = lane.categorySlug
    ? (categories.find((entry) => entry.slug === lane.categorySlug)?.name ?? "")
    : "";
  return products.filter((item) => {
    if ((item.status ?? "approved") !== "approved") return false;
    if (lane.categorySlug && item.categorySlug !== lane.categorySlug) return false;
    if (lane.audience && item.audience !== lane.audience) return false;
    if (
      lane.maxPricePaise !== undefined &&
      item.sellingPricePaise > lane.maxPricePaise
    ) {
      return false;
    }
    if (
      lane.minDiscountPercent !== undefined &&
      discountPercent(item) < lane.minDiscountPercent
    ) {
      return false;
    }
    const brandName =
      brands.find((brand) => brand.slug === item.brandSlug)?.name ?? "";
    return matchesQuery(item, lane.q, categoryName, brandName);
  }).length;
}

function brandFor(categorySlug: string | undefined): SeedProductDef["brandSlug"] {
  switch (categorySlug) {
    case "fashion":
      return "narmada-weave";
    case "beauty-personal-care":
      return "coastal-bloom";
    case "baby-kids":
      return "little-lotus";
    case "electronics-accessories":
    case "mobile-accessories":
      return "silicon-bay";
    case "sports-fitness":
    case "health-wellness":
      return "pulse-fit";
    case "stationery-office":
      return "ink-and-quill";
    case "bags-footwear":
      return "trailmark";
    default:
      return "aspera-home";
  }
}

function sellerFor(categorySlug: string | undefined): SeedProductDef["sellerKey"] {
  switch (categorySlug) {
    case "fashion":
      return "fashion";
    case "beauty-personal-care":
    case "health-wellness":
      return "wellness";
    case "baby-kids":
      return "mumbai";
    case "electronics-accessories":
    case "mobile-accessories":
      return "tech";
    case "sports-fitness":
      return "sports";
    case "bags-footwear":
      return "textile";
    default:
      return "home";
  }
}

function hsnFor(categorySlug: string | undefined) {
  switch (categorySlug) {
    case "fashion":
      return "6204";
    case "beauty-personal-care":
      return "3304";
    case "baby-kids":
      return "6111";
    case "electronics-accessories":
    case "mobile-accessories":
      return "8517";
    case "bags-footwear":
      return "4202";
    case "sports-fitness":
    case "health-wellness":
      return "9506";
    case "home-kitchen":
    case "household-essentials":
    case "general-merchandise":
      return "3924";
    default:
      return "4820";
  }
}

function titleFor(lane: Lane, index: number) {
  const style = STYLES[index % STYLES.length];
  const phrase = lane.q?.replace(/\s+/g, " ").trim();
  if (phrase) {
    const head = phrase.charAt(0).toUpperCase() + phrase.slice(1);
    return `${head} ${style}`;
  }
  if (lane.audience && lane.maxPricePaise) {
    return `${lane.audience === "women" ? "Women" : lane.audience === "men" ? "Men" : "Kids"} budget kurti ${style}`;
  }
  if (lane.audience === "women") return `Women everyday kurti ${style}`;
  if (lane.audience === "men") return `Men everyday shirt ${style}`;
  if (lane.audience === "kids") return `Kids everyday tee ${style}`;
  return `Everyday staple ${style}`;
}

/**
 * Add approved listings until every exposed browse target matches at least 10.
 * Titles include the search phrase, and each row stays in that target's category.
 */
export function navLaneProducts(
  base: SeedProductDef[],
  categories: SeedCategoryDef[],
  brands: readonly BrandRef[],
): SeedProductDef[] {
  const products = [...base];
  const lanes = CUSTOMER_BROWSE_HREFS.map(parseHref).sort((a, b) => {
    const qDelta = (b.q?.length ?? 0) - (a.q?.length ?? 0);
    if (qDelta !== 0) return qDelta;
    return (a.maxPricePaise ?? Number.MAX_SAFE_INTEGER) -
      (b.maxPricePaise ?? Number.MAX_SAFE_INTEGER);
  });
  const added: SeedProductDef[] = [];
  let serial = 0;

  for (const lane of lanes) {
    let have = catalogueMatchCount(products, lane.href, categories, brands);
    let variant = 0;
    while (have < 10) {
      serial += 1;
      variant += 1;
      const title = titleFor(lane, variant);
      const slug = `nav-${serial.toString(36)}`;
      const capped = lane.maxPricePaise;
      const sellingPricePaise = capped
        ? Math.max(9900, capped - 5000 - (variant % 5) * 500)
        : 69900 + (variant % 8) * 4000;
      const mrpPaise = Math.max(sellingPricePaise + 2000, Math.round(sellingPricePaise * 1.28));
      const categorySlug =
        lane.categorySlug ??
        (lane.q?.includes("earring") || lane.q === "cap"
          ? "fashion"
          : "general-merchandise");
      const audience =
        lane.audience ??
        (lane.q?.includes("earring")
          ? "women"
          : lane.q === "cap"
            ? "men"
            : undefined);
      const phrase = lane.q ?? title.toLowerCase();
      const item: SeedProductDef = {
        slug,
        title,
        summary: `${title} for regular use.`,
        description: `${title} in the ${categorySlug.replace(/-/g, " ")} range. ${phrase.charAt(0).toUpperCase()}${phrase.slice(1)} with a listed price and stock for everyday orders.`,
        categorySlug,
        brandSlug: brandFor(categorySlug),
        sellerKey: sellerFor(categorySlug),
        sku: `NAV-${serial}`,
        mrpPaise,
        sellingPricePaise,
        onHand: 24,
        weightGrams: 250,
        hsnCode: hsnFor(categorySlug),
        ...(audience ? { audience } : {}),
      };
      products.push(item);
      added.push(item);
      have += 1;
      if (variant > 40) break;
    }
  }

  return added;
}

/** Shopper browse and shop targets from the nav, chips, hero, home, and footer. */
export const CUSTOMER_BROWSE_HREFS: string[] = [
  '/browse',
  '/browse?categorySlug=baby-kids&audience=kids',
  '/browse?categorySlug=baby-kids&audience=kids&q=bib',
  '/browse?categorySlug=baby-kids&audience=kids&q=hoodie',
  '/browse?categorySlug=baby-kids&audience=kids&q=onesie',
  '/browse?categorySlug=baby-kids&audience=kids&q=plush',
  '/browse?categorySlug=baby-kids&audience=kids&q=swaddle',
  '/browse?categorySlug=baby-kids&audience=kids&q=toy',
  '/browse?categorySlug=baby-kids&q=baby',
  '/browse?categorySlug=baby-kids&q=blanket&audience=kids',
  '/browse?categorySlug=baby-kids&q=boys+ethnic&audience=kids',
  '/browse?categorySlug=baby-kids&q=boys+jeans&audience=kids',
  '/browse?categorySlug=baby-kids&q=boys+shirt&audience=kids',
  '/browse?categorySlug=baby-kids&q=boys+shorts&audience=kids',
  '/browse?categorySlug=baby-kids&q=boys+tee&audience=kids',
  '/browse?categorySlug=baby-kids&q=educational&audience=kids',
  '/browse?categorySlug=baby-kids&q=feeding&audience=kids',
  '/browse?categorySlug=baby-kids&q=game&audience=kids',
  '/browse?categorySlug=baby-kids&q=girls+dress&audience=kids',
  '/browse?categorySlug=baby-kids&q=girls+ethnic&audience=kids',
  '/browse?categorySlug=baby-kids&q=girls+skirt&audience=kids',
  '/browse?categorySlug=baby-kids&q=girls+top&audience=kids',
  '/browse?categorySlug=baby-kids&q=hoodie&audience=kids',
  '/browse?categorySlug=baby-kids&q=leggings&audience=kids',
  '/browse?categorySlug=baby-kids&q=onesie&audience=kids',
  '/browse?categorySlug=baby-kids&q=outdoor+toy&audience=kids',
  '/browse?categorySlug=baby-kids&q=romper&audience=kids',
  '/browse?categorySlug=baby-kids&q=soft+toy&audience=kids',
  '/browse?categorySlug=bags-footwear&audience=kids&q=sneaker',
  '/browse?categorySlug=bags-footwear&q=backpack',
  '/browse?categorySlug=bags-footwear&q=bag',
  '/browse?categorySlug=bags-footwear&q=belt',
  '/browse?categorySlug=bags-footwear&q=boot',
  '/browse?categorySlug=bags-footwear&q=casual+shoe',
  '/browse?categorySlug=bags-footwear&q=clutch',
  '/browse?categorySlug=bags-footwear&q=duffel',
  '/browse?categorySlug=bags-footwear&q=flat',
  '/browse?categorySlug=bags-footwear&q=formal+shoe',
  '/browse?categorySlug=bags-footwear&q=handbag',
  '/browse?categorySlug=bags-footwear&q=heel',
  '/browse?categorySlug=bags-footwear&q=jutti',
  '/browse?categorySlug=bags-footwear&q=kids+sandal',
  '/browse?categorySlug=bags-footwear&q=kids+sneaker',
  '/browse?categorySlug=bags-footwear&q=laptop+bag',
  '/browse?categorySlug=bags-footwear&q=luggage',
  '/browse?categorySlug=bags-footwear&q=men+sandal',
  '/browse?categorySlug=bags-footwear&q=pouch',
  '/browse?categorySlug=bags-footwear&q=sandal',
  '/browse?categorySlug=bags-footwear&q=school+bag',
  '/browse?categorySlug=bags-footwear&q=school+shoe',
  '/browse?categorySlug=bags-footwear&q=shoe',
  '/browse?categorySlug=bags-footwear&q=sling',
  '/browse?categorySlug=bags-footwear&q=slipper',
  '/browse?categorySlug=bags-footwear&q=sneaker',
  '/browse?categorySlug=bags-footwear&q=sports+shoe',
  '/browse?categorySlug=bags-footwear&q=tote',
  '/browse?categorySlug=bags-footwear&q=travel',
  '/browse?categorySlug=bags-footwear&q=wallet',
  '/browse?categorySlug=bags-footwear&q=women+sneaker',
  '/browse?categorySlug=beauty-personal-care',
  '/browse?categorySlug=beauty-personal-care&q=beard',
  '/browse?categorySlug=beauty-personal-care&q=brush',
  '/browse?categorySlug=beauty-personal-care&q=compact',
  '/browse?categorySlug=beauty-personal-care&q=conditioner',
  '/browse?categorySlug=beauty-personal-care&q=deodorant',
  '/browse?categorySlug=beauty-personal-care&q=face',
  '/browse?categorySlug=beauty-personal-care&q=face+pack',
  '/browse?categorySlug=beauty-personal-care&q=face+wash',
  '/browse?categorySlug=beauty-personal-care&q=foundation',
  '/browse?categorySlug=beauty-personal-care&q=hair+colour',
  '/browse?categorySlug=beauty-personal-care&q=hair+oil',
  '/browse?categorySlug=beauty-personal-care&q=hand+wash',
  '/browse?categorySlug=beauty-personal-care&q=kajal',
  '/browse?categorySlug=beauty-personal-care&q=lipstick',
  '/browse?categorySlug=beauty-personal-care&q=lotion',
  '/browse?categorySlug=beauty-personal-care&q=men+face',
  '/browse?categorySlug=beauty-personal-care&q=moisturiser',
  '/browse?categorySlug=beauty-personal-care&q=nail',
  '/browse?categorySlug=beauty-personal-care&q=oil',
  '/browse?categorySlug=beauty-personal-care&q=perfume',
  '/browse?categorySlug=beauty-personal-care&q=serum',
  '/browse?categorySlug=beauty-personal-care&q=shampoo',
  '/browse?categorySlug=beauty-personal-care&q=shave',
  '/browse?categorySlug=beauty-personal-care&q=soap',
  '/browse?categorySlug=beauty-personal-care&q=sunscreen',
  '/browse?categorySlug=electronics-accessories',
  '/browse?categorySlug=electronics-accessories&q=bike+cover',
  '/browse?categorySlug=electronics-accessories&q=cable',
  '/browse?categorySlug=electronics-accessories&q=camera',
  '/browse?categorySlug=electronics-accessories&q=car',
  '/browse?categorySlug=electronics-accessories&q=car+charger',
  '/browse?categorySlug=electronics-accessories&q=car+cover',
  '/browse?categorySlug=electronics-accessories&q=car+mount',
  '/browse?categorySlug=electronics-accessories&q=charger',
  '/browse?categorySlug=electronics-accessories&q=earbud',
  '/browse?categorySlug=electronics-accessories&q=earphone',
  '/browse?categorySlug=electronics-accessories&q=fitness+band',
  '/browse?categorySlug=electronics-accessories&q=headphone',
  '/browse?categorySlug=electronics-accessories&q=helmet',
  '/browse?categorySlug=electronics-accessories&q=keyboard',
  '/browse?categorySlug=electronics-accessories&q=mouse',
  '/browse?categorySlug=electronics-accessories&q=smart',
  '/browse?categorySlug=electronics-accessories&q=smartwatch',
  '/browse?categorySlug=electronics-accessories&q=speaker',
  '/browse?categorySlug=electronics-accessories&q=stand',
  '/browse?categorySlug=electronics-accessories&q=usb',
  '/browse?categorySlug=electronics-accessories&q=watch',
  '/browse?categorySlug=fashion',
  '/browse?categorySlug=fashion&audience=men',
  '/browse?categorySlug=fashion&audience=men&q=ethnic',
  '/browse?categorySlug=fashion&audience=men&q=jean',
  '/browse?categorySlug=fashion&audience=men&q=kurta',
  '/browse?categorySlug=fashion&audience=men&q=shirt',
  '/browse?categorySlug=fashion&audience=men&q=tee',
  '/browse?categorySlug=fashion&audience=men&q=trouser',
  '/browse?categorySlug=fashion&audience=women',
  '/browse?categorySlug=fashion&audience=women&maxPricePaise=59900',
  '/browse?categorySlug=fashion&audience=women&q=dress',
  '/browse?categorySlug=fashion&audience=women&q=dupatta',
  '/browse?categorySlug=fashion&audience=women&q=jean',
  '/browse?categorySlug=fashion&audience=women&q=jegging',
  '/browse?categorySlug=fashion&audience=women&q=kurta',
  '/browse?categorySlug=fashion&audience=women&q=lehenga',
  '/browse?categorySlug=fashion&audience=women&q=palazzo',
  '/browse?categorySlug=fashion&audience=women&q=saree',
  '/browse?categorySlug=fashion&audience=women&q=scarf',
  '/browse?categorySlug=fashion&audience=women&q=tee',
  '/browse?categorySlug=fashion&audience=women&q=top',
  '/browse?categorySlug=fashion&q=anarkali&audience=women',
  '/browse?categorySlug=fashion&q=anarkali+set&audience=women',
  '/browse?categorySlug=fashion&q=anklet&audience=women',
  '/browse?categorySlug=fashion&q=bangle&audience=women',
  '/browse?categorySlug=fashion&q=belt&audience=men',
  '/browse?categorySlug=fashion&q=blazer&audience=men',
  '/browse?categorySlug=fashion&q=blouse&audience=women',
  '/browse?categorySlug=fashion&q=blouse+piece&audience=women',
  '/browse?categorySlug=fashion&q=bra&audience=women',
  '/browse?categorySlug=fashion&q=bracelet&audience=women',
  '/browse?categorySlug=fashion&q=bridal&audience=women',
  '/browse?categorySlug=fashion&q=bridal+lehenga&audience=women',
  '/browse?categorySlug=fashion&q=cap&audience=men',
  '/browse?categorySlug=fashion&q=casual+shirt&audience=men',
  '/browse?categorySlug=fashion&q=chain&audience=women',
  '/browse?categorySlug=fashion&q=chino&audience=men',
  '/browse?categorySlug=fashion&q=choker&audience=women',
  '/browse?categorySlug=fashion&q=cotton+kurti&audience=women',
  '/browse?categorySlug=fashion&q=cotton+saree&audience=women',
  '/browse?categorySlug=fashion&q=cotton+set&audience=women',
  '/browse?categorySlug=fashion&q=cotton+suit&audience=women',
  '/browse?categorySlug=fashion&q=designer+blouse&audience=women',
  '/browse?categorySlug=fashion&q=dress&audience=women',
  '/browse?categorySlug=fashion&q=dress+material&audience=women',
  '/browse?categorySlug=fashion&q=drop+earring&audience=women',
  '/browse?categorySlug=fashion&q=dupatta&audience=women',
  '/browse?categorySlug=fashion&q=dupatta+set&audience=women',
  '/browse?categorySlug=fashion&q=earring&audience=women',
  '/browse?categorySlug=fashion&q=ethnic+bottom&audience=women',
  '/browse?categorySlug=fashion&q=evening+gown&audience=women',
  '/browse?categorySlug=fashion&q=formal+shirt&audience=men',
  '/browse?categorySlug=fashion&q=georgette&audience=women',
  '/browse?categorySlug=fashion&q=gown&audience=women',
  '/browse?categorySlug=fashion&q=hoodie&audience=men',
  '/browse?categorySlug=fashion&q=innerwear&audience=men',
  '/browse?categorySlug=fashion&q=jacket&audience=men',
  '/browse?categorySlug=fashion&q=jeans&audience=men',
  '/browse?categorySlug=fashion&q=jeans&audience=women',
  '/browse?categorySlug=fashion&q=jewellery&audience=women',
  '/browse?categorySlug=fashion&q=jewellery+set&audience=women',
  '/browse?categorySlug=fashion&q=jhumka&audience=women',
  '/browse?categorySlug=fashion&q=jumpsuit&audience=women',
  '/browse?categorySlug=fashion&q=kada&audience=women',
  '/browse?categorySlug=fashion&q=kurta&audience=men',
  '/browse?categorySlug=fashion&q=kurta+pant&audience=women',
  '/browse?categorySlug=fashion&q=kurta+set&audience=men',
  '/browse?categorySlug=fashion&q=kurta+set&audience=women',
  '/browse?categorySlug=fashion&q=kurti&audience=women',
  '/browse?categorySlug=fashion&q=lehenga&audience=women',
  '/browse?categorySlug=fashion&q=lingerie&audience=women',
  '/browse?categorySlug=fashion&q=long+kurti&audience=women',
  '/browse?categorySlug=fashion&q=necklace&audience=women',
  '/browse?categorySlug=fashion&q=nehru&audience=men',
  '/browse?categorySlug=fashion&q=nightwear&audience=men',
  '/browse?categorySlug=fashion&q=nightwear&audience=women',
  '/browse?categorySlug=fashion&q=palazzo&audience=women',
  '/browse?categorySlug=fashion&q=party+lehenga&audience=women',
  '/browse?categorySlug=fashion&q=party+saree&audience=women',
  '/browse?categorySlug=fashion&q=party+suit&audience=women',
  '/browse?categorySlug=fashion&q=patiala&audience=women',
  '/browse?categorySlug=fashion&q=pendant&audience=women',
  '/browse?categorySlug=fashion&q=polo&audience=men',
  '/browse?categorySlug=fashion&q=printed+kurti&audience=women',
  '/browse?categorySlug=fashion&q=ring&audience=women',
  '/browse?categorySlug=fashion&q=salwar&audience=women',
  '/browse?categorySlug=fashion&q=saree&audience=women',
  '/browse?categorySlug=fashion&q=shapewear&audience=women',
  '/browse?categorySlug=fashion&q=sharara&audience=women',
  '/browse?categorySlug=fashion&q=sherwani&audience=men',
  '/browse?categorySlug=fashion&q=shirt&audience=men',
  '/browse?categorySlug=fashion&q=shorts&audience=men',
  '/browse?categorySlug=fashion&q=shrug&audience=women',
  '/browse?categorySlug=fashion&q=silk+saree&audience=women',
  '/browse?categorySlug=fashion&q=skirt&audience=women',
  '/browse?categorySlug=fashion&q=straight+kurti&audience=women',
  '/browse?categorySlug=fashion&q=stud&audience=women',
  '/browse?categorySlug=fashion&q=tee&audience=men',
  '/browse?categorySlug=fashion&q=top&audience=women',
  '/browse?categorySlug=fashion&q=track&audience=men',
  '/browse?categorySlug=fashion&q=trouser&audience=men',
  '/browse?categorySlug=fashion&q=trouser&audience=women',
  '/browse?categorySlug=fashion&q=vest&audience=men',
  '/browse?categorySlug=general-merchandise&q=laundry',
  '/browse?categorySlug=health-wellness',
  '/browse?categorySlug=health-wellness&q=ayurveda',
  '/browse?categorySlug=health-wellness&q=first+aid',
  '/browse?categorySlug=health-wellness&q=immunity',
  '/browse?categorySlug=health-wellness&q=mask',
  '/browse?categorySlug=health-wellness&q=oral',
  '/browse?categorySlug=health-wellness&q=protein',
  '/browse?categorySlug=health-wellness&q=sanitiser',
  '/browse?categorySlug=health-wellness&q=vitamin',
  '/browse?categorySlug=health-wellness&q=yoga',
  '/browse?categorySlug=home-kitchen',
  '/browse?categorySlug=home-kitchen&q=appliance',
  '/browse?categorySlug=home-kitchen&q=bath+mat',
  '/browse?categorySlug=home-kitchen&q=bathroom',
  '/browse?categorySlug=home-kitchen&q=bedsheet',
  '/browse?categorySlug=home-kitchen&q=blanket',
  '/browse?categorySlug=home-kitchen&q=candle',
  '/browse?categorySlug=home-kitchen&q=clock',
  '/browse?categorySlug=home-kitchen&q=container',
  '/browse?categorySlug=home-kitchen&q=cookware',
  '/browse?categorySlug=home-kitchen&q=curtain',
  '/browse?categorySlug=home-kitchen&q=cushion',
  '/browse?categorySlug=home-kitchen&q=dinnerware',
  '/browse?categorySlug=home-kitchen&q=frame',
  '/browse?categorySlug=home-kitchen&q=hanger',
  '/browse?categorySlug=home-kitchen&q=kitchen+tool',
  '/browse?categorySlug=home-kitchen&q=laundry',
  '/browse?categorySlug=home-kitchen&q=organiser',
  '/browse?categorySlug=home-kitchen&q=pillow',
  '/browse?categorySlug=home-kitchen&q=showpiece',
  '/browse?categorySlug=home-kitchen&q=storage',
  '/browse?categorySlug=home-kitchen&q=tawa',
  '/browse?categorySlug=home-kitchen&q=towel',
  '/browse?categorySlug=home-kitchen&q=wall',
  '/browse?categorySlug=household-essentials',
  '/browse?categorySlug=household-essentials&q=beverage',
  '/browse?categorySlug=household-essentials&q=clean',
  '/browse?categorySlug=household-essentials&q=detergent',
  '/browse?categorySlug=household-essentials&q=dish',
  '/browse?categorySlug=household-essentials&q=floor',
  '/browse?categorySlug=household-essentials&q=freshener',
  '/browse?categorySlug=household-essentials&q=pet',
  '/browse?categorySlug=household-essentials&q=pet+bed',
  '/browse?categorySlug=household-essentials&q=pet+food',
  '/browse?categorySlug=household-essentials&q=pet+groom',
  '/browse?categorySlug=household-essentials&q=pet+toy',
  '/browse?categorySlug=household-essentials&q=snack',
  '/browse?categorySlug=household-essentials&q=spice',
  '/browse?categorySlug=household-essentials&q=staple',
  '/browse?categorySlug=household-essentials&q=tissue',
  '/browse?categorySlug=mobile-accessories&q=cable',
  '/browse?categorySlug=mobile-accessories&q=case',
  '/browse?categorySlug=mobile-accessories&q=charger',
  '/browse?categorySlug=mobile-accessories&q=power+bank',
  '/browse?categorySlug=mobile-accessories&q=screen',
  '/browse?categorySlug=sports-fitness',
  '/browse?categorySlug=sports-fitness&q=badminton',
  '/browse?categorySlug=sports-fitness&q=cricket',
  '/browse?categorySlug=sports-fitness&q=dumbbell',
  '/browse?categorySlug=sports-fitness&q=football',
  '/browse?categorySlug=sports-fitness&q=resistance',
  '/browse?categorySlug=sports-fitness&q=shoe',
  '/browse?categorySlug=sports-fitness&q=skipping',
  '/browse?categorySlug=sports-fitness&q=sports+tee',
  '/browse?categorySlug=sports-fitness&q=tracksuit',
  '/browse?categorySlug=sports-fitness&q=yoga',
  '/browse?categorySlug=stationery-office',
  '/browse?categorySlug=stationery-office&q=diary',
  '/browse?categorySlug=stationery-office&q=folder',
  '/browse?categorySlug=stationery-office&q=marker',
  '/browse?categorySlug=stationery-office&q=note',
  '/browse?categorySlug=stationery-office&q=notepad',
  '/browse?categorySlug=stationery-office&q=pen',
  '/browse?categorySlug=stationery-office&q=pencil',
  '/browse?categorySlug=stationery-office&q=stapler',
  '/browse?maxPricePaise=29900',
  '/browse?maxPricePaise=59900',
  '/browse?maxPricePaise=99900',
  '/browse?q=cap',
  '/browse?q=earring',
  '/browse?sort=rating',
  '/shop',
  '/shop?categorySlug=fashion&audience=men&sort=newest',
  '/shop?categorySlug=fashion&audience=women&sort=newest',
  '/browse?categorySlug=baby-kids&audience=kids&q=feeding',
];
