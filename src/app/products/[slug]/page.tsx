import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductReviewsPanel } from "@/components/product-reviews-panel";
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

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          {product.category.name}
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          {product.title}
        </h1>
        <p className="mt-3 text-lg text-muted">{product.summary}</p>
      </div>
      <section className="flex flex-col gap-3">
        <p>{product.description}</p>
        <p className="text-sm text-muted">
          Sold by {sellerName}
          {product.brand ? ` · ${product.brand.name}` : ""}
          {product.countryOfOrigin
            ? ` · Origin ${product.countryOfOrigin}`
            : ""}
        </p>
      </section>
      <section aria-labelledby="variants-heading" className="flex flex-col gap-3">
        <h2 id="variants-heading" className="text-xl font-semibold">
          Variants
        </h2>
        <ul className="flex flex-col gap-3">
          {product.variants.map((variant) => {
            const available = Math.max(
              (variant.inventory?.onHand ?? 0) -
                (variant.inventory?.reserved ?? 0),
              0,
            );
            return (
              <li key={variant.id} className="border-b border-border pb-3">
                <p className="font-medium">{variant.title}</p>
                <p className="text-sm">
                  {formatPaise(variant.sellingPricePaise)}
                  {variant.mrpPaise > variant.sellingPricePaise
                    ? ` (MRP ${formatPaise(variant.mrpPaise)})`
                    : ""}
                  {" · "}
                  {available > 0 ? `${available} available` : "Out of stock"}
                </p>
                <p className="text-xs text-muted">SKU {variant.sku}</p>
                <AddToCartButton
                  variantId={variant.id}
                  availableQty={available}
                />
              </li>
            );
          })}
        </ul>
      </section>
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
    </main>
  );
}
