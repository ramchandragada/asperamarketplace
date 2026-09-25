import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductReviewsPanel } from "@/components/product-reviews-panel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";
import { formatPaise } from "@/modules/catalogue/helpers";
import { getPublicProductBySlug } from "@/modules/catalogue/service";
import { getOptionalActor } from "@/modules/identity/service";
import { listApprovedReviewsForProduct } from "@/modules/trust/service";

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
  };
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
  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null;
  const primary = product.variants[0];
  const initials = product.title.slice(0, 1).toUpperCase();

  return (
    <PageShell>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] border border-border bg-gradient-to-br from-accent-soft via-surface to-warning-soft/50 shadow-[var(--shadow-card)]">
          <span
            className="absolute inset-0 flex items-center justify-center text-8xl font-semibold text-accent/25"
            aria-hidden
          >
            {initials}
          </span>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
              {product.category.name}
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              {product.title}
            </h1>
            <p className="mt-3 text-lg text-muted">{product.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sellerVerified ? <Badge tone="success">Verified seller</Badge> : null}
              {product.countryOfOrigin ? (
                <Badge tone="info">Origin {product.countryOfOrigin}</Badge>
              ) : null}
              {average != null ? (
                <Badge>
                  {average.toFixed(1)}★ · {reviews.length} review
                  {reviews.length === 1 ? "" : "s"}
                </Badge>
              ) : (
                <Badge tone="neutral">No approved reviews yet</Badge>
              )}
            </div>
          </div>

          <Card className="p-4">
            <p className="text-sm text-muted">Sold by</p>
            <p className="font-semibold">{sellerName}</p>
            <p className="mt-1 text-xs text-muted">
              Seller approval reflects marketplace KYC review in this environment.
              Not a legal or GST endorsement.
            </p>
            {product.hsnCode ? (
              <p className="mt-2 text-xs text-muted">HSN {product.hsnCode}</p>
            ) : null}
          </Card>

          <section aria-labelledby="variants-heading" className="flex flex-col gap-3">
            <h2 id="variants-heading" className="text-xl font-semibold">
              Choose a variant
            </h2>
            <ul className="flex flex-col gap-3">
              {product.variants.map((variant) => {
                const available = Math.max(
                  (variant.inventory?.onHand ?? 0) -
                    (variant.inventory?.reserved ?? 0),
                  0,
                );
                return (
                  <li
                    key={variant.id}
                    className="rounded-[var(--radius-sm)] border border-border bg-surface p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{variant.title}</p>
                        <p className="mt-1 text-lg font-semibold">
                          {formatPaise(variant.sellingPricePaise)}
                          {variant.mrpPaise > variant.sellingPricePaise ? (
                            <span className="ml-2 text-sm font-normal text-muted line-through">
                              {formatPaise(variant.mrpPaise)}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          SKU {variant.sku} ·{" "}
                          {available > 0
                            ? `${available} available`
                            : "Out of stock"}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Delivery fee and ETA confirmed at checkout
                        </p>
                      </div>
                      <AddToCartButton
                        variantId={variant.id}
                        availableQty={available}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            {!primary ? (
              <p className="text-sm text-muted">No active variants.</p>
            ) : null}
          </section>

          <section className="text-sm leading-7 text-muted">
            <h2 className="text-lg font-semibold text-foreground">About</h2>
            <p className="mt-2 whitespace-pre-wrap">{product.description}</p>
            {product.brand ? (
              <p className="mt-2">Brand: {product.brand.name}</p>
            ) : null}
          </section>
        </div>
      </div>

      <ProductReviewsPanel
        productId={product.id}
        canReview={Boolean(actor)}
        initialReviews={reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          title: review.title,
          body: review.body,
          createdAt: review.createdAt.toISOString(),
        }))}
      />

      <p className="text-sm">
        <Link href="/browse" className="underline">
          Back to browse
        </Link>
        {" · "}
        <Link href="/cart" className="underline">
          Cart
        </Link>
      </p>
    </PageShell>
  );
}
