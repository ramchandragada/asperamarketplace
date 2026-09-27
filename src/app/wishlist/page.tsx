import { WishlistPageClient } from "@/components/wishlist-page-client";
import { PageShell } from "@/components/ui/page-shell";
import { getOptionalActor } from "@/modules/identity/service";
import { listWishlistProducts } from "@/modules/wishlist/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wishlist · Aspera Marketplace" };

export default async function WishlistPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    return (
      <PageShell narrow>
        <h1 className="font-display text-3xl font-semibold">Wishlist</h1>
        <p className="mt-3 text-muted">Sign in to view your wishlist.</p>
        <a
          href="/login?next=/wishlist"
          className="mt-6 inline-flex w-fit rounded-[var(--radius-sm)] bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
        >
          Sign in
        </a>
      </PageShell>
    );
  }

  const items = await listWishlistProducts(actor.userId);
  return (
    <PageShell>
      <WishlistPageClient initialItems={items} />
    </PageShell>
  );
}
