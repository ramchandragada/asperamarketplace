import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { PageShell } from "@/components/ui/page-shell";
import { resolveProductBadge } from "@/modules/catalogue/helpers";
import { prisma } from "@/platform/db/prisma";

export const dynamic = "force-dynamic";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function findSeller(slug: string) {
  const sellers = await prisma.seller.findMany({
    where: { status: "approved" },
  });
  return (
    sellers.find((seller) => {
      const name = seller.tradeName ?? seller.legalName;
      return slugify(name) === slug || seller.id === slug;
    }) ?? null
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const seller = await findSeller(slug);
  return {
    title: seller
      ? `${seller.tradeName ?? seller.legalName} · Aspera Marketplace`
      : "Seller shop · Aspera Marketplace",
  };
}

export default async function PublicSellerShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const seller = await findSeller(slug);
  if (!seller) notFound();

  const name = seller.tradeName ?? seller.legalName;
  const products = await prisma.product.findMany({
    where: { sellerId: seller.id, status: "approved" },
    take: 48,
    orderBy: { publishedAt: "desc" },
    include: {
      category: true,
      brand: { select: { slug: true, name: true } },
      seller: { select: { legalName: true, tradeName: true, status: true } },
      images: { where: { isPrimary: true }, take: 1 },
      variants: { where: { isActive: true }, include: { inventory: true } },
    },
  });

  const items = products.map((product) => {
    const prices = product.variants.map((v) => v.sellingPricePaise);
    const mrps = product.variants.map((v) => v.mrpPaise);
    const availableQty = product.variants.reduce((sum, variant) => {
      const onHand = variant.inventory?.onHand ?? 0;
      const reserved = variant.inventory?.reserved ?? 0;
      return sum + Math.max(onHand - reserved, 0);
    }, 0);
    const attrs =
      product.attributes &&
      typeof product.attributes === "object" &&
      !Array.isArray(product.attributes)
        ? (product.attributes as Record<string, unknown>)
        : {};
    const sellerVerified = product.seller.status === "approved";
    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      summary: product.summary,
      categoryName: product.category.name,
      sellerName: product.seller.tradeName ?? product.seller.legalName,
      sellerVerified,
      minPricePaise: prices.length ? Math.min(...prices) : 0,
      minMrpPaise: mrps.length ? Math.min(...mrps) : null,
      availableQty,
      ratingAverage:
        typeof attrs.ratingAverage === "number" ? attrs.ratingAverage : null,
      reviewCount: typeof attrs.reviewCount === "number" ? attrs.reviewCount : 0,
      dealEndsAt:
        typeof attrs.dealEndsAt === "string" ? attrs.dealEndsAt : null,
      deliveryFeePaise:
        typeof attrs.deliveryFeePaise === "number"
          ? attrs.deliveryFeePaise
          : null,
      freeDeliveryHint: attrs.deliveryFeePaise === 0,
      variantCount: product.variants.length,
      badge: resolveProductBadge({
        brandSlug: product.brand?.slug,
        brandName: product.brand?.name,
        sellerVerified,
        availableQty,
        freeDelivery: attrs.deliveryFeePaise === 0,
      }),
      primaryImageUrl: product.images[0]?.url ?? null,
      primaryImageAlt: product.images[0]?.altText ?? product.title,
    };
  });

  return (
    <PageShell>
      <header className="rounded-[var(--radius)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          Seller shop
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">{name}</h1>
        <p className="mt-2 text-sm text-muted">
          Verified seller · {items.length} products
        </p>
      </header>
      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          No public listings yet.{" "}
          <Link href="/shop" className="text-accent underline">
            Continue shopping
          </Link>
        </p>
      )}
    </PageShell>
  );
}
