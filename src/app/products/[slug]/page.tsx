import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";
import { ProductReviewsPanel } from "@/components/product-reviews-panel";
import { ProductShareBar } from "@/components/product-share";
import { PdpTrustBadgeRow } from "@/components/pdp-trust-badge-row";
import { PageShell } from "@/components/ui/page-shell";
import {
  getPublicProductBySlug,
  searchApprovedProducts,
} from "@/modules/catalogue/service";
import { getOptionalActor } from "@/modules/identity/service";
import { listApprovedReviewsForProduct } from "@/modules/trust/service";
import { prisma } from "@/platform/db/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://asperamarketplace.vercel.app";
  if (!product) {
    return { title: "Product · Aspera Marketplace" };
  }
  const image = product.images.find((img) => img.isPrimary)?.url ?? product.images[0]?.url;
  return {
    title: `${product.title} | Aspera Marketplace`,
    description: product.summary ?? product.description?.slice(0, 160),
    alternates: { canonical: `${siteUrl}/products/${product.slug}` },
    openGraph: {
      title: `${product.title} | Aspera Marketplace`,
      description: product.summary ?? undefined,
      url: `${siteUrl}/products/${product.slug}`,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} | Aspera Marketplace`,
      description: product.summary ?? undefined,
    },
  };
}

function readAttrs(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

async function absoluteProductUrl(slug: string) {
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ??
    headerList.get("host") ??
    "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}/products/${encodeURIComponent(slug)}`;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const actor = await getOptionalActor();
  const [reviews, sellerProductCount, similar, alsoBought, shareUrl] =
    await Promise.all([
      listApprovedReviewsForProduct(product.id),
      prisma.product.count({
        where: { sellerId: product.sellerId, status: "approved" },
      }),
      searchApprovedProducts({
        categorySlug: product.category.slug,
        page: 1,
        pageSize: 10,
        sort: "newest",
      }),
      searchApprovedProducts({
        page: 1,
        pageSize: 12,
        sort: "rating",
      }),
      absoluteProductUrl(product.slug),
    ]);

  const sellerName = product.seller.tradeName ?? product.seller.legalName;
  const sellerVerified = product.seller.status === "approved";
  const attrs = readAttrs(product.attributes);
  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null;

  const highlightsRaw =
    attrs.highlights &&
    typeof attrs.highlights === "object" &&
    !Array.isArray(attrs.highlights)
      ? (attrs.highlights as Record<string, string>)
      : {};
  const highlightsMap = new Map<string, string>();
  for (const [label, value] of Object.entries(highlightsRaw)) {
    highlightsMap.set(label.toLowerCase(), String(value));
  }
  if (product.brand) {
    highlightsMap.set("brand", product.brand.name);
  }
  if (product.countryOfOrigin && !highlightsMap.has("origin")) {
    highlightsMap.set("origin", product.countryOfOrigin);
  }
  const highlights = [...highlightsMap.entries()].map(([label, value]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
  }));
  const ratingDistribution =
    reviews.length > 0
      ? reviews.reduce(
          (acc, review) => {
            const key = String(review.rating);
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        )
      : null;

  const similarItems = similar.items
    .filter((item) => item.id !== product.id)
    .slice(0, 8);
  const similarIds = new Set(similarItems.map((item) => item.id));
  const alsoBoughtItems = alsoBought.items
    .filter((item) => item.id !== product.id && !similarIds.has(item.id))
    .slice(0, 8);

  const variants = product.variants.map((variant) => {
    const available = Math.max(
      (variant.inventory?.onHand ?? 0) - (variant.inventory?.reserved ?? 0),
      0,
    );
    const optionValues =
      variant.optionValues &&
      typeof variant.optionValues === "object" &&
      !Array.isArray(variant.optionValues)
        ? (variant.optionValues as Record<string, string>)
        : null;
    return {
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      mrpPaise: variant.mrpPaise,
      sellingPricePaise: variant.sellingPricePaise,
      availableQty: available,
      optionValues,
    };
  });

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://asperamarketplace.vercel.app";
  const lowestPrice = Math.min(
    ...variants.map((v) => v.sellingPricePaise),
    Number.POSITIVE_INFINITY,
  );
  const inStock = variants.some((v) => v.availableQty > 0);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.summary ?? product.description,
    image: product.images.map((img) => img.url).filter(Boolean),
    sku: variants[0]?.sku,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand.name }
      : undefined,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${product.slug}`,
      priceCurrency: "INR",
      price: Number.isFinite(lowestPrice)
        ? (lowestPrice / 100).toFixed(2)
        : undefined,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: sellerName,
      },
    },
    ...(average != null && reviews.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: average.toFixed(1),
            reviewCount: reviews.length,
          },
        }
      : {}),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: `${siteUrl}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category.name,
        item: `${siteUrl}/browse?categorySlug=${encodeURIComponent(product.category.slug)}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.title,
        item: `${siteUrl}/products/${product.slug}`,
      },
    ],
  };

  return (
    <PageShell className="pb-24 sm:pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([productJsonLd, breadcrumbJsonLd]),
        }}
      />
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-accent">
              Home
            </Link>
          </li>
          <li aria-hidden className="text-muted">
            &gt;
          </li>
          <li>
            <Link href="/shop" className="hover:text-accent">
              Shop
            </Link>
          </li>
          <li aria-hidden className="text-muted">
            &gt;
          </li>
          <li>
            <Link
              href={`/browse?categorySlug=${encodeURIComponent(product.category.slug)}`}
              className="hover:text-accent"
            >
              {product.category.name}
            </Link>
          </li>
          <li aria-hidden className="text-muted">
            &gt;
          </li>
          <li className="max-w-[40ch] truncate text-foreground" aria-current="page">
            {product.title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 overflow-visible lg:grid-cols-2">
        <ProductGallery
          title={product.title}
          images={product.images.map((image) => ({
            id: image.id,
            url: image.url,
            altText: image.altText,
            isPrimary: image.isPrimary,
          }))}
        />

        <div className="flex flex-col gap-5">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              {product.title}
            </h1>
            <p className="mt-2 text-base text-muted">{product.summary}</p>
            <div className="mt-3">
              <PdpTrustBadgeRow sellerApproved={sellerVerified} />
            </div>
            {average != null && reviews.length > 0 ? (
              <p className="mt-3 flex items-center gap-2 text-sm">
                <span className="inline-flex items-center rounded bg-success px-1.5 py-0.5 font-semibold text-white">
                  ★ {average.toFixed(1)}
                </span>
                <span className="text-muted">
                  {reviews.length.toLocaleString("en-IN")} ratings ·{" "}
                  {reviews.length} reviews
                </span>
              </p>
            ) : null}
            <div className="mt-4">
              <ProductShareBar title={product.title} url={shareUrl} />
            </div>
          </div>

          <ProductPurchasePanel
            variants={variants}
            highlights={highlights}
            productTitle={product.title}
          />

          <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              Sold by
            </p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{sellerName}</p>
                <p className="mt-1 text-sm text-muted">
                  {sellerVerified ? "Verified seller" : "Seller"} ·{" "}
                  {sellerProductCount} products
                </p>
              </div>
              <Link
                href={`/shops/${encodeURIComponent(
                  sellerName
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "")
                    .slice(0, 80),
                )}`}
                className="shrink-0 text-sm font-medium text-accent hover:underline"
              >
                View shop →
              </Link>
            </div>
          </div>

          <section className="text-sm leading-7 text-muted">
            <h2 className="text-lg font-semibold text-foreground">
              About this item
            </h2>
            <p className="mt-2 whitespace-pre-wrap">{product.description}</p>
          </section>
        </div>
      </div>

      <ProductReviewsPanel
        productId={product.id}
        canReview={Boolean(actor)}
        seededAverage={reviews.length > 0 ? average : null}
        seededCount={reviews.length}
        seededDistribution={ratingDistribution}
        initialReviews={reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          title: review.title,
          body: review.body,
          createdAt: review.createdAt.toISOString(),
          authorName: review.authorName,
        }))}
      />

      {similarItems.length > 0 ? (
        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold">
              Similar products
            </h2>
            <Link
              href={`/browse?categorySlug=${encodeURIComponent(product.category.slug)}`}
              className="text-sm font-medium text-accent hover:underline"
            >
              See all →
            </Link>
          </div>
          <div className="rail-scroll">
            {similarItems.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      {alsoBoughtItems.length > 0 ? (
        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold">
              Customers also bought
            </h2>
            <Link
              href="/shop?sort=rating"
              className="text-sm font-medium text-accent hover:underline"
            >
              See all →
            </Link>
          </div>
          <div className="rail-scroll">
            {alsoBoughtItems.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
