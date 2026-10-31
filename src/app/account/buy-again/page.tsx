import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BuyAgainPanel,
  type BuyAgainItem,
} from "@/components/buy-again-panel";
import { PageShell } from "@/components/ui/page-shell";
import { getOptionalActor } from "@/modules/identity/service";
import { prisma } from "@/platform/db/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Buy Again" };

export default async function BuyAgainPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/account/buy-again");
  }

  const lines = await prisma.orderLine.findMany({
    where: {
      order: {
        userId: actor.userId,
        paidAt: { not: null },
        status: { not: "cancelled" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 400,
    select: {
      variantId: true,
      productId: true,
      productTitle: true,
      variantTitle: true,
      quantity: true,
      unitPricePaise: true,
      createdAt: true,
    },
  });

  const productIds = [...new Set(lines.map((line) => line.productId))];
  const variantIds = [...new Set(lines.map((line) => line.variantId))];

  const [products, variants] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        slug: true,
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { url: true, altText: true },
        },
      },
    }),
    prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        isActive: true,
        inventory: { select: { onHand: true, reserved: true } },
      },
    }),
  ]);

  const productById = new Map(products.map((row) => [row.id, row]));
  const variantById = new Map(variants.map((row) => [row.id, row]));

  const byVariant = new Map<string, BuyAgainItem>();
  for (const line of lines) {
    const existing = byVariant.get(line.variantId);
    if (existing) {
      existing.timesOrdered += 1;
      continue;
    }

    const product = productById.get(line.productId);
    const variant = variantById.get(line.variantId);
    const inventory = variant?.inventory;
    const available =
      Boolean(variant?.isActive) &&
      inventory != null &&
      inventory.onHand - inventory.reserved > 0;
    const image = product?.images[0];

    byVariant.set(line.variantId, {
      variantId: line.variantId,
      productId: line.productId,
      productTitle: line.productTitle,
      variantTitle: line.variantTitle,
      productSlug: product?.slug ?? null,
      imageUrl: image?.url ?? null,
      imageAlt: image?.altText ?? null,
      unitPricePaise: line.unitPricePaise,
      lastOrderedAt: line.createdAt.toISOString(),
      timesOrdered: 1,
      lastQuantity: line.quantity,
      available,
    });
  }

  const items = Array.from(byVariant.values()).sort(
    (a, b) =>
      new Date(b.lastOrderedAt).getTime() - new Date(a.lastOrderedAt).getTime(),
  );

  return (
    <PageShell>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            Account
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Buy Again</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Reorder products from past purchases. Use the left panel to filter by
            time or stock — one click adds the item back to your cart.
          </p>
        </div>
        <p className="text-sm text-muted">
          <Link href="/account" className="text-accent hover:underline">
            Back to account
          </Link>
          {" · "}
          <Link href="/orders" className="text-accent hover:underline">
            Your Orders
          </Link>
        </p>
      </div>

      <BuyAgainPanel items={items} />
    </PageShell>
  );
}
