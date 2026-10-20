import Link from "next/link";
import { CartPanel } from "@/components/cart-panel";
import { PageShell } from "@/components/ui/page-shell";
import {
  emptyCartView,
  estimateCart,
  getCartForIdentity,
} from "@/modules/cart/service";
import { readGuestCartToken } from "@/modules/cart/guest";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cart" };

export default async function CartPage() {
  let actor: Awaited<ReturnType<typeof getOptionalActor>> = null;
  try {
    actor = await getOptionalActor();
  } catch {
    actor = null;
  }

  let guestToken: string | null = null;
  try {
    guestToken = actor ? null : await readGuestCartToken();
  } catch {
    guestToken = null;
  }

  let cart: Awaited<ReturnType<typeof getCartForIdentity>> | ReturnType<
    typeof emptyCartView
  > = emptyCartView();
  let initialSnapshot = null as Awaited<
    ReturnType<typeof estimateCart>
  >["snapshot"];
  let initialSavingsPaise = 0;

  try {
    if (actor) {
      const identity = { type: "user" as const, userId: actor.userId };
      cart = await getCartForIdentity(identity);
      if (cart.items.length > 0) {
        const estimate = await estimateCart(identity);
        cart = estimate.cart;
        initialSnapshot = estimate.snapshot;
        initialSavingsPaise = estimate.savingsPaise;
      }
    } else if (guestToken) {
      const identity = { type: "guest" as const, guestToken };
      cart = await getCartForIdentity(identity);
      if (cart.items.length > 0) {
        const estimate = await estimateCart(identity);
        cart = estimate.cart;
        initialSnapshot = estimate.snapshot;
        initialSavingsPaise = estimate.savingsPaise;
      }
    }
  } catch {
    cart = emptyCartView();
    initialSnapshot = null;
    initialSavingsPaise = 0;
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
      <CartPanel
        initialCart={cart}
        initialSnapshot={initialSnapshot}
        initialSavingsPaise={initialSavingsPaise}
      />
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
