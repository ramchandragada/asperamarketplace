"use client";

import { ProductCard, type ProductCardModel } from "@/components/product-card";
import { ProductLoopRail } from "@/components/product-loop-rail";

/** Client wrapper so the server homepage never passes a render function across the RSC boundary. */
export function TrendingProductsRail({
  products,
}: {
  products: ProductCardModel[];
}) {
  return (
    <ProductLoopRail
      items={products}
      label="Trending products"
      renderItem={(item) => <ProductCard product={item} />}
    />
  );
}
