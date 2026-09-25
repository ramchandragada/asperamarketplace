import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";
import { ProductReviewsPanel } from "@/components/product-reviews-panel";
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
  return {
    title: product
      ? `${product.title} · Aspera Marketplace`
      : "Product · Aspera Marketplace",
    description: product?.summary,
  };
}

function readAttrs(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
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
  const reviews = await listApprovedReviewsForProduct(product.id);
  const sellerName = product.seller.tradeName ?? product.seller.legalName;
  const sellerVerified = product.seller.status === "approved";
  const attrs = readAttrs(product.attributes);
  const seededAverage =
    typeof attrs.ratingAverage === "number" ? attrs.ratingAverage : null;
  const seededCount =
    typeof attrs.reviewCount === "number" ? attrs.reviewCount : 0;
  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : seededAverage;

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
    attrs.ratingDistribution &&
    typeof attrs.ratingDistribution === "object" &&
    !Array.isArray(attrs.ratingDistribution)
      ? (attrs.ratingDistribution as Record<string, number>)
      : null;

  const sellerProductCount = await prisma.product.count({
    where: { sellerId: product.sellerId, status: "approved" },
  });

  const similar = await searchApprovedProducts({
    categorySlug: product.category.slug,
    page: 1,
    pageSize: 8,
    sort: "newest",
  });
  const similarItems = similar.items.filter((item) => item.id !== product.id);

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

  return (
    <PageShell className="pb-24 sm:pb-12">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>
        <span aria-hidden> › </span>
        <Link
          href={`/browse?categorySlug=${encodeURIComponent(product.category.slug)}`}
          className="hover:text-accent"
        >
          {product.category.name}
        </Link>
        <span aria-hidden> › </span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
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
            {average != null && (reviews.length > 0 || seededCount > 0) ? (
              <p className="mt-3 flex items-center gap-2 text-sm">
                <span className="inline-flex items-center rounded bg-success px-1.5 py-0.5 font-semibold text-white">
                  ★ {average.toFixed(1)}
                </span>
                <span className="text-muted">
                  {reviews.length > 0
                    ? `${reviews.length} ratings`
                    : `${seededCount.toLocaleString("en-IN")} ratings`}
                </span>
              </p>
            ) : null}
          </div>

          <ProductPurchasePanel variants={variants} highlights={highlights} />

          <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              Sold by
            </p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{sellerName}</p>
                <p className="mt-1 text-sm text-muted">
                  {sellerVerified ? "★ Verified seller" : "Seller"} ·{" "}
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
            <h2 className="text-lg font-semibold text-foreground">About this item</h2>
            <p className="mt-2 whitespace-pre-wrap">{product.description}</p>
          </section>
        </div>
      </div>

      <ProductReviewsPanel
        productId={product.id}
        canReview={Boolean(actor)}
        seededAverage={seededAverage}
        seededCount={seededCount}
        seededDistribution={ratingDistribution}
        initialReviews={reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          title: review.title,
          body: review.body,
          createdAt: review.createdAt.toISOString(),
        }))}
      />

      {similarItems.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-2xl font-semibold">You may also like</h2>
          <div className="rail-scroll">
            {similarItems.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
