/**
 * Creates the Studio Loom seller and ten approved listings through the HTTP API.
 * Idempotent: a second run finishes whatever the first run left incomplete.
 *
 *   BASE_URL=https://asperamarketplace.vercel.app \
 *   ADMIN_EMAIL=admin@aspera.local \
 *   ADMIN_PASSWORD=... \
 *   pnpm exec tsx scripts/provision-studio-seller.ts
 */
import {
  STUDIO_LOOM_PRODUCTS,
  STUDIO_LOOM_SELLER,
} from "../src/modules/catalogue/studio-loom-catalogue";

const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const adminEmail = process.env.ADMIN_EMAIL ?? "admin@aspera.local";
const adminPassword = process.env.ADMIN_PASSWORD ?? "AsperaAdminDevOnly1!";

type Json = Record<string, unknown>;

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
  }
}

function cookieHeader(jar: Map<string, string>) {
  return [...jar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

function storeCookies(jar: Map<string, string>, response: Response) {
  const raw =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
  for (const entry of raw) {
    const pair = entry.split(";")[0] ?? "";
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

async function api(
  jar: Map<string, string>,
  method: string,
  path: string,
  body?: Json | FormData,
): Promise<Json> {
  const headers = new Headers();
  const cookie = cookieHeader(jar);
  if (cookie) headers.set("cookie", cookie);
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body) {
    headers.set("content-type", "application/json");
    payload = JSON.stringify(body);
  }
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: payload });
  storeCookies(jar, response);
  const json = (await response.json()) as {
    data: Json | null;
    message: string;
    code: string;
    fieldErrors: unknown;
  };
  if (!response.ok) {
    throw new ApiError(
      `${method} ${path} failed (${response.status} ${json.code}): ${json.message} ${JSON.stringify(json.fieldErrors ?? {})}`,
      response.status,
      json.code,
    );
  }
  return (json.data ?? {}) as Json;
}

async function login(email: string, password: string) {
  const jar = new Map<string, string>();
  await api(jar, "POST", "/api/auth/login", { email, password });
  return jar;
}

async function sellerSession() {
  const jar = new Map<string, string>();
  try {
    await api(jar, "POST", "/api/auth/register", {
      email: STUDIO_LOOM_SELLER.email,
      password: STUDIO_LOOM_SELLER.password,
      displayName: STUDIO_LOOM_SELLER.displayName,
      intent: "seller",
    });
    console.log("Registered Studio Loom seller");
    return jar;
  } catch (error) {
    if (error instanceof ApiError && error.code === "CONFLICT") {
      console.log("Studio Loom seller already exists; signing in");
      return login(STUDIO_LOOM_SELLER.email, STUDIO_LOOM_SELLER.password);
    }
    throw error;
  }
}

type SellerRow = {
  id: string;
  status: string;
  version: number;
  tradeName: string | null;
  documents?: Array<{ id: string }>;
};

async function ensureApprovedSeller(sellerJar: Map<string, string>, adminJar: Map<string, string>) {
  const listed = (await api(sellerJar, "GET", "/api/seller")).sellers as SellerRow[];
  let seller = listed.find((row) => row.tradeName === STUDIO_LOOM_SELLER.tradeName) ?? listed[0];

  if (!seller) {
    const created = (await api(sellerJar, "POST", "/api/seller", {
      legalName: STUDIO_LOOM_SELLER.legalName,
      tradeName: STUDIO_LOOM_SELLER.tradeName,
      contactEmail: STUDIO_LOOM_SELLER.contactEmail,
      contactPhone: STUDIO_LOOM_SELLER.contactPhone,
      pan: STUDIO_LOOM_SELLER.pan,
      gstin: STUDIO_LOOM_SELLER.gstin,
      registeredState: STUDIO_LOOM_SELLER.registeredState,
    })).seller as SellerRow;
    seller = created;
    console.log(`Created seller draft ${seller.id}`);
  }

  if (seller.status === "rejected") {
    throw new Error("Seller was rejected and must return to draft before it can be submitted again");
  }

  if (seller.status === "draft") {
    const fresh = ((await api(sellerJar, "GET", "/api/seller")).sellers as SellerRow[]).find(
      (row) => row.id === seller?.id,
    );
    if (!fresh?.documents?.length) {
      const form = new FormData();
      form.set("documentType", "business_registration");
      form.set(
        "file",
        new File([Buffer.from("%PDF-1.4 studio-loom-registration")], "registration.pdf", {
          type: "application/pdf",
        }),
      );
      await api(sellerJar, "POST", `/api/seller/${seller.id}/documents`, form);
      console.log("Uploaded KYC document");
    }
    const submitted = (await api(sellerJar, "POST", "/api/seller/submit", {
      sellerId: seller.id,
      acceptAgreement: true,
    })).seller as SellerRow;
    seller = submitted;
    console.log(`Submitted seller at version ${seller.version}`);
  }

  if (seller.status === "submitted" || seller.status === "under_review") {
    const current = ((await api(sellerJar, "GET", "/api/seller")).sellers as SellerRow[]).find(
      (row) => row.id === seller?.id,
    );
    const expectedVersion = current?.version ?? seller.version;
    const reviewed = (await api(adminJar, "POST", "/api/admin/sellers/review", {
      sellerId: seller.id,
      decision: "approve",
      reason: "Studio Loom catalogue approved for the storefront",
      expectedVersion,
    })).seller as SellerRow;
    seller = reviewed;
    console.log(`Approved seller ${seller.id}`);
  }

  if (seller.status !== "approved") {
    throw new Error(`Seller ${seller.id} is ${seller.status}, expected approved`);
  }
  return seller;
}

async function ensureProducts(sellerJar: Map<string, string>, adminJar: Map<string, string>, sellerId: string) {
  const categories = (await api(new Map(), "GET", "/api/catalogue/categories")).categories as Array<{
    id: string;
    slug: string;
  }>;
  const categoryId = (slug: string) =>
    categories.find((category) => category.slug === slug)?.id ??
    categories.find((category) => category.slug === "general-merchandise")?.id ??
    categories[0]?.id;

  const existing = ((await api(sellerJar, "GET", `/api/seller/products?sellerId=${sellerId}`)).products ??
    []) as Array<{
    id: string;
    status: string;
    version: number;
    title: string;
    variants: Array<{ sku: string; id: string }>;
  }>;

  const bySku = new Map<string, (typeof existing)[number]>();
  for (const product of existing) {
    for (const variant of product.variants) bySku.set(variant.sku, product);
  }

  for (const item of STUDIO_LOOM_PRODUCTS) {
    let product = bySku.get(item.sku);
    if (!product) {
      const category = categoryId(item.categorySlug);
      if (!category) throw new Error("No active category is available");
      const created = await api(sellerJar, "POST", "/api/seller/products", {
        sellerId,
        categoryId: category,
        brandName: "Studio Loom",
        title: item.title,
        summary: item.summary,
        description: item.description,
        countryOfOrigin: "India",
        hsnCode: item.hsnCode,
        imageUrl: item.imageUrl,
        variant: {
          sku: item.sku,
          title: item.variantTitle,
          mrpPaise: item.mrpPaise,
          sellingPricePaise: item.sellingPricePaise,
          initialStock: item.initialStock,
          weightGrams: item.weightGrams,
        },
      });
      product = created.product as (typeof existing)[number];
      console.log(`Drafted ${item.sku}`);
    }

    if (product.status === "draft" || product.status === "rejected") {
      const submitted = (await api(sellerJar, "POST", "/api/seller/products/submit", {
        productId: product.id,
      })).product as (typeof existing)[number];
      product = submitted;
      console.log(`Submitted ${item.sku} version ${product.version}`);
    }

    if (product.status === "submitted") {
      const approved = (await api(adminJar, "POST", "/api/admin/products/review", {
        productId: product.id,
        decision: "approve",
        reason: "Studio Loom listing accepted",
        expectedVersion: product.version,
      })).product as (typeof existing)[number];
      product = approved;
      console.log(`Approved ${item.sku}`);
    }

    if (product.status !== "approved") {
      throw new Error(`${item.sku} is ${product.status}, expected approved`);
    }
  }
}

async function verifyStorefront(sellerJar: Map<string, string>) {
  const search = await api(
    new Map(),
    "GET",
    "/api/catalogue/products?q=Studio%20Loom&pageSize=24&sort=newest",
  );
  const items = (search.items ?? []) as Array<{
    title: string;
    slug: string;
    primaryImageUrl: string | null;
  }>;
  const titles = new Set(STUDIO_LOOM_PRODUCTS.map((item) => item.title));
  const matched = items.filter((item) => titles.has(item.title));
  if (matched.length !== 10) {
    throw new Error(`Public search found ${matched.length} Studio Loom listings, expected 10`);
  }
  if (matched.some((item) => !item.primaryImageUrl?.includes("images.unsplash.com"))) {
    throw new Error("A Studio Loom listing is missing its Unsplash photo");
  }
  console.log("Public search returned all 10 listings with photos");

  const detail = (await api(new Map(), "GET", `/api/catalogue/products/${matched[0]?.slug}`))
    .product as {
    title: string;
    variants: Array<{ id: string; sellingPricePaise: number }>;
    seller: { tradeName: string | null };
  };
  if (detail.seller.tradeName !== "Studio Loom") {
    throw new Error(`PDP seller is ${detail.seller.tradeName}`);
  }
  const variantId = detail.variants[0]?.id;
  if (!variantId) throw new Error("PDP has no variant");

  const guest = new Map<string, string>();
  const guestCart = (await api(guest, "POST", "/api/cart", { variantId, quantity: 1 })).cart as {
    items: Array<{ quantity: number; sku: string; productTitle: string }>;
  };
  const guestLine = guestCart.items[0];
  if (!guestLine) throw new Error("Guest cart did not keep the listing");
  console.log(`Guest cart accepted ${guestLine.sku} (${guestLine.productTitle})`);

  const addresses = ((await api(sellerJar, "GET", "/api/checkout/addresses")).addresses ?? []) as Array<{
    id: string;
  }>;
  let addressId = addresses[0]?.id;
  if (!addressId) {
    const created = (await api(sellerJar, "POST", "/api/checkout/addresses", {
      label: "Studio",
      fullName: "Studio Loom",
      phone: STUDIO_LOOM_SELLER.contactPhone,
      line1: "12 Residency Road",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560025",
      country: "IN",
      isDefault: true,
    })).address as { id: string };
    addressId = created.id;
  }

  await api(sellerJar, "POST", "/api/cart", { variantId, quantity: 1 });
  const preview = await api(sellerJar, "POST", "/api/checkout/preview", { addressId });
  const snapshot = preview.snapshot as {
    totalPaise: number;
    subtotalPaise: number;
    shippingPaise: number;
    taxPaise: number;
    discountPaise: number;
    lines: Array<{ sku: string }>;
  };
  const expected =
    snapshot.subtotalPaise + snapshot.shippingPaise + snapshot.taxPaise - snapshot.discountPaise;
  if (snapshot.totalPaise !== expected || snapshot.lines.length < 1) {
    throw new Error("Checkout preview total did not match the priced lines");
  }
  console.log(`Checkout preview total ${snapshot.totalPaise} paise for ${snapshot.lines[0]?.sku}`);

  const sellerCart = (await api(sellerJar, "GET", "/api/cart")).cart as {
    items: Array<{ variantId: string }>;
  };
  for (const line of sellerCart.items) {
    await api(sellerJar, "PATCH", "/api/cart/items", {
      variantId: line.variantId,
      quantity: 0,
    });
  }
  console.log("Cleared the seller cart after preview");
}

async function main() {
  console.log(`Provisioning Studio Loom against ${baseUrl}`);
  const sellerJar = await sellerSession();
  const adminJar = await login(adminEmail, adminPassword);
  const seller = await ensureApprovedSeller(sellerJar, adminJar);
  await ensureProducts(sellerJar, adminJar, seller.id);
  await verifyStorefront(sellerJar);
  console.log("Studio Loom seller and 10 products are live");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
