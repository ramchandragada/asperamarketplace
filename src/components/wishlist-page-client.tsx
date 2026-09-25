"use client";

import { ProductCard, type ProductCardModel } from "@/components/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";

export function WishlistPageClient({
  initialItems,
}: {
  initialItems: ProductCardModel[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">My wishlist</h1>
        <p className="mt-2 text-sm text-muted">
          {initialItems.length} saved item{initialItems.length === 1 ? "" : "s"}
        </p>
      </div>
      {initialItems.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it here."
          action={
            <Link href="/shop" className="text-sm font-medium text-accent underline">
              Continue shopping
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {initialItems.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      )}
    </div>
  );
}
