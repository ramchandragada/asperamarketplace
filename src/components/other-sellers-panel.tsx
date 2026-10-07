import Link from "next/link";
import { formatPaise } from "@/modules/catalogue/helpers";
import type { SiblingSellerOffer } from "@/modules/catalogue/service";

export function OtherSellersPanel({
  offers,
}: {
  offers: SiblingSellerOffer[];
}) {
  const others = offers.filter((offer) => !offer.isCurrent);
  if (others.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="other-sellers-heading"
      className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)]"
    >
      <h2
        id="other-sellers-heading"
        className="text-xs font-semibold tracking-wide text-muted uppercase"
      >
        Other sellers on this product
      </h2>
      <p className="mt-1 text-sm text-muted">
        Same item from other verified shops — price and stock are theirs.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {others.map((offer) => {
          const inStock = offer.availableQty > 0;
          return (
            <li key={offer.productId}>
              <Link
                href={`/products/${encodeURIComponent(offer.slug)}`}
                className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 transition hover:border-accent/40 hover:bg-background"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">
                    {offer.sellerName}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {offer.sellerVerified ? "Verified seller" : "Seller"}
                    {" · "}
                    {inStock
                      ? `${offer.availableQty} in stock`
                      : "Out of stock"}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-semibold text-foreground">
                    {formatPaise(offer.sellingPricePaise)}
                  </span>
                  {offer.mrpPaise > offer.sellingPricePaise ? (
                    <span className="block text-xs text-muted line-through">
                      {formatPaise(offer.mrpPaise)}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
