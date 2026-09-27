import Link from "next/link";
import { CartPanel } from "@/components/cart-panel";
import { PageShell } from "@/components/ui/page-shell";
import {
  emptyCartView,
  getCartForIdentity,
} from "@/modules/cart/service";
import { readGuestCartToken } from "@/modules/cart/guest";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cart · Aspera Marketplace" };

export default async function CartPage() {
  const actor = await getOptionalActor();
  const guestToken = actor ? null : await readGuestCartToken();

  let cart: Awaited<ReturnType<typeof getCartForIdentity>> | ReturnType<
    typeof emptyCartView
  > = emptyCartView();
  if (actor) {
    cart = await getCartForIdentity({ type: "user", userId: actor.userId });
  } else if (guestToken) {
    cart = await getCartForIdentity({ type: "guest", guestToken });
  }

  return (
    <PageShell>
      <div>
        <h1 className="font-display text-3xl font-semibold">Your cart</h1>
        <p className="mt-2 text-muted">
          Review items and update quantities. Sign in is required only at
          checkout.
        </p>
      </div>
      <CartPanel initialCart={cart} />
      {!actor && cart.items.length > 0 ? (
        <p className="rounded-lg border border-border bg-accent-soft px-4 py-3 text-sm text-foreground">
          You&apos;re shopping as a guest.{" "}
          <Link href="/login?next=/checkout" className="font-semibold text-accent underline">
            Sign in at checkout
          </Link>{" "}
          to place your order — your cart will be saved.
        </p>
      ) : null}
      <p className="text-sm">
        <Link href="/shop" className="text-accent underline">
          Continue shopping
        </Link>
      </p>
    </PageShell>
  );
}
