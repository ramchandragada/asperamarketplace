/**
 * Convert scraped MD Computers catalogue JSON → Aspera pc-catalogue-data.ts
 * Writes: generated data module + downloads images into public/products/
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import path from "path";
import https from "https";
import http from "http";

const ROOT = process.cwd();
const INPUT = process.argv[2] || "/tmp/md-scrape/catalogue-v2.json";
const OUT_TS = path.join(ROOT, "src/modules/catalogue/pc-catalogue-data.ts");
const OUT_JSON = path.join(ROOT, "src/modules/catalogue/md-import-snapshot.json");
const IMG_DIR = path.join(ROOT, "public/products");
mkdirSync(IMG_DIR, { recursive: true });

const data = JSON.parse(readFileSync(INPUT, "utf8"));

const CATEGORIES = [
  { slug: "processors", name: "Processors (CPU)", description: "Desktop CPUs from Intel and AMD for every budget." },
  { slug: "motherboards", name: "Motherboards", description: "Intel and AMD boards — DDR4 and DDR5, mATX to ATX." },
  { slug: "graphics-cards", name: "Graphics Cards", description: "GeForce RTX and Radeon GPUs for gaming and creation." },
  { slug: "memory-ram", name: "Memory (RAM)", description: "DDR4 and DDR5 desktop memory kits." },
  { slug: "storage-ssd", name: "SSD & Storage", description: "NVMe, SATA SSD and hard drives." },
  { slug: "cabinets", name: "Cabinets", description: "PC cases with airflow, tempered glass and ARGB." },
  { slug: "power-supplies", name: "Power Supplies (SMPS)", description: "Bronze to Platinum ATX power supplies." },
  { slug: "cpu-coolers", name: "CPU Coolers", description: "Air coolers and AIO liquid coolers." },
  { slug: "keyboard-mouse", name: "Keyboard & Mouse", description: "Wired and wireless keyboards, mice and combos." },
  { slug: "monitors", name: "Monitors", description: "FHD, QHD and 4K monitors for work and gaming." },
  { slug: "ups", name: "UPS & Power Backup", description: "Line-interactive and online UPS for home PCs." },
  { slug: "laptops", name: "Laptops", description: "Gaming and productivity notebooks." },
];

const BRAND_ALIASES = [
  ["cooler master", "cooler-master"], ["coolermaster", "cooler-master"],
  ["ant esports", "ant-esports"], ["cosmic byte", "cosmic-byte"],
  ["g.skill", "gskill"], ["g skill", "gskill"], ["g-skill", "gskill"],
  ["western digital", "wd"], ["be quiet!", "be-quiet"], ["be quiet", "be-quiet"],
  ["lian li", "lian-li"], ["teamgroup", "team-group"], ["team group", "team-group"],
  ["inno3d", "inno3d"], ["deepcool", "deepcool"], ["deep cool", "deepcool"],
];

function slugify(s) {
  return String(s).toLowerCase().normalize("NFKD")
    .replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

function inferBrand(name) {
  const lower = name.toLowerCase();
  for (const [alias, slug] of BRAND_ALIASES) {
    if (lower.includes(alias)) return { slug, name: alias.replace(/\b\w/g, c => c.toUpperCase()).replace("Gskill", "G.Skill").replace("Wd", "WD").replace("Be-Quiet", "be quiet!") };
  }
  const known = ["AMD","Intel","ASUS","MSI","Gigabyte","ASRock","Corsair","NZXT","Thermaltake","Logitech","Razer","HyperX","Kingston","Crucial","Samsung","Seagate","Zotac","Sapphire","PNY","Colorful","Acer","LG","Dell","BenQ","ViewSonic","APC","ADATA","XPG","Lexar","Arctic","Noctua","Antec","Galax","Palit","Zebronics","Redragon","Aula","Portronics","TP-Link","Luminous","Microtek","Eaton","Fractal","Phanteks","SilverStone","EKWB","Fingers","Kreo","Marvo","GameSir","HP","Lenovo","Toshiba","Transcend","Patriot","Enter","Numeric","Intex","Amkette","Hikvision","iBall"];
  for (const b of known.sort((a,b)=>b.length-a.length)) {
    if (new RegExp(`\\b${b}\\b`, "i").test(name)) return { slug: slugify(b), name: b === "AMD" || b === "LG" || b === "HP" || b === "PNY" || b === "MSI" || b === "ASUS" || b === "WD" || b === "APC" ? b : b };
  }
  // first token fallback
  const tok = name.split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, "");
  if (tok.length >= 2) return { slug: slugify(tok), name: tok };
  return { slug: "generic", name: "Generic" };
}

function inferCategoryFromUrl(p) {
  // Prefer the scrape category when present — URL heuristics are only a fallback.
  if (p.categorySlug) return p.categorySlug;
  const hay = `${p.url} ${p.image || ""} ${p.name || ""}`.toLowerCase();
  const rules = [
    [/cpu-cooler|liquid-cooler|air-cooler|\baio\b|radiator|cooler/, "cpu-coolers"],
    [/graphics-card|geforce|radeon|rtx-|rx-?\d|\bgpu\b/, "graphics-cards"],
    [/motherboard|\bmobo\b|b550|b650|b760|z790|x670/, "motherboards"],
    [/\bram\b|ddr[45]|ripjaws|vengeance|memory-ram/, "memory-ram"],
    [/\bssd\b|nvme|hard-disk|\bhdd\b|storage|wd-blue|seagate|barracuda/, "storage-ssd"],
    [/cabinet|casing|chassis|mid-tower|full-tower/, "cabinets"],
    [/\bsmps\b|power-supply|\bpsu\b/, "power-supplies"],
    [/monitor|ultragear|odyssey/, "monitors"],
    [/keyboard|mouse|keychron|gamepad|headset/, "keyboard-mouse"],
    [/\bups\b|inverter/, "ups"],
    [/laptop|notebook/, "laptops"],
    [/processor|\bryzen\b|core-i|threadripper|\bcpu\b/, "processors"],
  ];
  for (const [re, slug] of rules) if (re.test(hay)) return slug;
  return "cabinets";
}

function hsnFor(cat) {
  const map = {
    processors: "8542", motherboards: "8473", "graphics-cards": "8471",
    "memory-ram": "8473", "storage-ssd": "8471", cabinets: "8473",
    "power-supplies": "8504", "cpu-coolers": "8414", "keyboard-mouse": "8471",
    monitors: "8528", ups: "8504", laptops: "8471",
  };
  return map[cat] || "8471";
}

function weightFor(cat) {
  const map = {
    processors: 350, motherboards: 900, "graphics-cards": 1200,
    "memory-ram": 200, "storage-ssd": 150, cabinets: 6000,
    "power-supplies": 1800, "cpu-coolers": 1200, "keyboard-mouse": 800,
    monitors: 4500, ups: 7000, laptops: 2500,
  };
  return map[cat] || 500;
}

function sellerFor(cat) {
  // Existing Aspera Pune sellers from prior PC seed
  const map = {
    processors: "ddp", motherboards: "gip", "graphics-cards": "ddp",
    "memory-ram": "pcp", "storage-ssd": "pcp", cabinets: "tzp",
    "power-supplies": "tzp", "cpu-coolers": "tzp", "keyboard-mouse": "pcc",
    monitors: "gip", ups: "pcc", laptops: "ddp",
  };
  return map[cat] || "ddp";
}

function originalSummary(name, cat) {
  const catLabel = CATEGORIES.find(c => c.slug === cat)?.name || "PC component";
  return `${name} — genuine ${catLabel.toLowerCase()} for Indian DIY and gaming builds.`;
}

function originalDescription(name, cat, specs) {
  const bits = [];
  bits.push(`${name} is listed on Aspera for builders who want clear pricing and verified sellers.`);
  if (specs && Object.keys(specs).length) {
    const top = Object.entries(specs).slice(0, 6).map(([k,v]) => `${k}: ${v}`).join("; ");
    bits.push(`Key specs — ${top}.`);
  } else {
    bits.push(`Part of our ${CATEGORIES.find(c=>c.slug===cat)?.name || "PC"} range with street-aligned India pricing.`);
  }
  bits.push("Ships from approved Aspera sellers. Check compatibility with your motherboard, case, and PSU before checkout.");
  return bits.join(" ");
}

async function download(url, dest) {
  if (!url || existsSync(dest)) return existsSync(dest);
  const client = url.startsWith("https") ? https : http;
  return new Promise((resolve) => {
    const req = client.get(url, {
      headers: { "User-Agent": "Mozilla/5.0", Referer: "https://mdcomputers.in/" },
      timeout: 20000,
    }, async (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        resolve(await download(res.headers.location, dest));
        return;
      }
      if (res.statusCode !== 200) { res.resume(); resolve(false); return; }
      try {
        await pipeline(res, createWriteStream(dest));
        resolve(true);
      } catch { resolve(false); }
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => { req.destroy(); resolve(false); });
  });
}

// Clean + dedupe products
const raw = data.products || [];
const cleaned = [];
const seenSlug = new Set();
const brandsMap = new Map();

for (const p of raw) {
  let name = (p.name || "").trim().replace(/\s+/g, " ");
  if (!name || /quick view|add to cart|^compare$|welcome back|login|sign ?up/i.test(name)) continue;
  if (!p.sell || p.sell < 100) continue;
  // drop absurd outliers unless GPU/laptop/workstation
  const cat = inferCategoryFromUrl(p);
  if (p.sell > 500000 && !["graphics-cards","laptops","processors","monitors"].includes(cat)) continue;

  const brand = inferBrand(name);
  brandsMap.set(brand.slug, brand.name);

  let slug = slugify(name);
  if (!slug || slug.length < 3) slug = slugify(p.url.split("/").pop());
  let base = slug;
  let n = 2;
  while (seenSlug.has(slug)) { slug = `${base}-${n++}`; }
  seenSlug.add(slug);

  const mrp = Math.max(p.mrp || p.sell, p.sell);
  const sell = p.sell;
  cleaned.push({
    sourceUrl: p.url,
    name, cat, brand,
    slug,
    mrpPaise: Math.round(mrp * 100),
    sellingPricePaise: Math.round(sell * 100),
    image: p.image || (p.detailImages && p.detailImages[0]) || null,
    specs: p.specs || null,
    summaryHint: p.summaryHint || null,
  });
}

console.log(`Cleaned ${cleaned.length} / ${raw.length}`);

// Cap per category to keep seed manageable but rich (max 40 each, prefer mid prices)
const byCat = {};
for (const p of cleaned) (byCat[p.cat] ||= []).push(p);
const selected = [];
for (const cat of CATEGORIES.map(c => c.slug)) {
  const list = (byCat[cat] || []).sort((a,b) => a.sellingPricePaise - b.sellingPricePaise);
  if (!list.length) continue;
  // take evenly spaced sample up to 36
  const max = Math.min(36, list.length);
  if (list.length <= max) selected.push(...list);
  else {
    for (let i = 0; i < max; i++) {
      const idx = Math.round(i * (list.length - 1) / (max - 1));
      selected.push(list[idx]);
    }
  }
}
// dedupe again by slug
const finalMap = new Map();
for (const p of selected) finalMap.set(p.slug, p);
const final = [...finalMap.values()];
console.log(`Selected ${final.length} products across categories`);

// Download images (limit concurrency)
const sellers = [
  { key: "pcc", tradeName: "Pune City Computers", legalName: "Pune City Computers Private Limited" },
  { key: "tzp", tradeName: "TechZone Pune", legalName: "TechZone Pune Private Limited" },
  { key: "pcp", tradeName: "Prime Components Pune", legalName: "Prime Components Pune Private Limited" },
  { key: "gip", tradeName: "Galaxy IT Pune", legalName: "Galaxy IT Pune Private Limited" },
  { key: "ddp", tradeName: "DigitalDeck Pune", legalName: "DigitalDeck Pune Private Limited" },
];

let downloaded = 0, failed = 0;
const CONCURRENCY = 8;
for (let i = 0; i < final.length; i += CONCURRENCY) {
  const batch = final.slice(i, i + CONCURRENCY);
  await Promise.all(batch.map(async (p) => {
    const ext = (p.image || "").match(/\.(jpg|jpeg|png|webp)/i)?.[1]?.toLowerCase() || "jpg";
    const file = `${p.slug}.${ext === "jpeg" ? "jpg" : ext}`;
    const dest = path.join(IMG_DIR, file);
    const ok = p.image ? await download(p.image, dest) : false;
    p.imagePath = ok ? `/products/${file}` : null;
    if (ok) downloaded++; else failed++;
  }));
  if (i % 40 === 0) console.log(`images ${Math.min(i+CONCURRENCY, final.length)}/${final.length}`);
}
console.log(`Images downloaded=${downloaded} failed=${failed}`);

// Ensure all brands from products
for (const p of final) brandsMap.set(p.brand.slug, p.brand.name);
// keep prior common brands too
for (const b of ["amd","intel","asus","msi","gigabyte","asrock","corsair","kingston","crucial","samsung","wd","seagate","zotac","sapphire","cooler-master","nzxt","logitech","acer","lg","apc"]) {
  if (!brandsMap.has(b)) brandsMap.set(b, b.split("-").map(w=>w.toUpperCase()==="AMD"||w.toUpperCase()==="LG"||w.toUpperCase()==="WD"||w.toUpperCase()==="APC"||w.toUpperCase()==="MSI"||w.toUpperCase()==="ASUS"?w.toUpperCase():w[0].toUpperCase()+w.slice(1)).join(" ").replace("Wd","WD"));
}

const brands = [...brandsMap.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([slug,name])=>({slug,name}));

const products = final.map((p, idx) => ({
  slug: p.slug,
  categorySlug: p.cat,
  brandSlug: p.brand.slug,
  sellerKey: sellerFor(p.cat),
  title: p.name.slice(0, 160),
  summary: originalSummary(p.name, p.cat).slice(0, 220),
  description: originalDescription(p.name, p.cat, p.specs),
  sku: `ASP-${p.cat.slice(0,3).toUpperCase()}-${String(idx+1).padStart(4,"0")}`,
  sellingPricePaise: p.sellingPricePaise,
  mrpPaise: p.mrpPaise,
  onHand: 8 + (idx % 20),
  weightGrams: weightFor(p.cat),
  hsnCode: hsnFor(p.cat),
  imagePath: p.imagePath,
}));

const snapshot = {
  source: "mdcomputers.in",
  scrapedAt: data.scrapedAt,
  importedAt: new Date().toISOString(),
  rawCount: raw.length,
  cleanedCount: cleaned.length,
  importedCount: products.length,
  byCategory: Object.fromEntries(CATEGORIES.map(c => [c.slug, products.filter(p=>p.categorySlug===c.slug).length])),
  products: products.map(p => ({ slug: p.slug, title: p.title, categorySlug: p.categorySlug, sellingPricePaise: p.sellingPricePaise, imagePath: p.imagePath, sourceHint: final.find(f=>f.slug===p.slug)?.sourceUrl })),
};
writeFileSync(OUT_JSON, JSON.stringify(snapshot, null, 2));

const ts = `/**
 * Aspera PC-components catalogue — expanded from India street-price research
 * (MD Computers public listings used as price/name reference; copy is Aspera-original).
 * Generated ${new Date().toISOString()}.
 */
export type PcCategoryDef = { slug: string; name: string; description: string };
export type PcBrandDef = { slug: string; name: string };
export type PcSellerDef = { key: string; legalName: string; tradeName: string };
export type PcProductDef = {
  slug: string;
  categorySlug: string;
  brandSlug: string;
  sellerKey: string;
  title: string;
  summary: string;
  description: string;
  sku: string;
  sellingPricePaise: number;
  mrpPaise: number;
  onHand: number;
  weightGrams: number;
  hsnCode: string;
  imagePath: string | null;
};

export const PC_CATEGORIES: PcCategoryDef[] = ${JSON.stringify(CATEGORIES, null, 2)};

export const PC_BRANDS: PcBrandDef[] = ${JSON.stringify(brands, null, 2)};

export const PC_SELLERS: PcSellerDef[] = ${JSON.stringify(sellers, null, 2)};

export const PC_PRODUCTS: PcProductDef[] = ${JSON.stringify(products, null, 2)};
`;

writeFileSync(OUT_TS, ts);
console.log(`Wrote ${OUT_TS} with ${products.length} products, ${brands.length} brands, ${CATEGORIES.length} categories`);
console.log(JSON.stringify(snapshot.byCategory, null, 2));
