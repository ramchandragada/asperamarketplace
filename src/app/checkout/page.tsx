import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutPanel } from "@/components/checkout-panel";
import {
  getCartForActor,
  getLatestReservedCheckout,
  listAddresses,
} from "@/modules/cart/service";
import type { CheckoutSnapshot } from "@/modules/cart/pricing";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/checkout");
  }
  const [cart, addresses, reservedSession] = await Promise.all([
    getCartForActor(actor),
    listAddresses(actor),
    getLatestReservedCheckout(actor),
  ]);

  const reserved = reservedSession
    ? {
        id: reservedSession.id,
        totalPaise: reservedSession.totalPaise,
        reservedUntil: reservedSession.reservedUntil?.toISOString() ?? null,
        snapshot: reservedSession.snapshot as CheckoutSnapshot,
      }
    : null;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-6 md:py-12">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          Checkout
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Checkout</h1>
        <p className="mt-2 text-muted">
          Confirm your address, reserve stock, place the order, then pay with
          the development mock (no live charges).
        </p>
      </div>
      <CheckoutPanel
        initialCart={cart}
        initialAddresses={addresses}
        initialReserved={reserved}
      />
      <p className="text-sm">
        <Link href="/cart" className="underline">
          Back to cart
        </Link>
      </p>
    </main>
  );
}
