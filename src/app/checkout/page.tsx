import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutPanel } from "@/components/checkout-panel";
import { getCartForActor, listAddresses } from "@/modules/cart/service";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout · Aspera Marketplace" };

export default async function CheckoutPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/checkout");
  }
  const [cart, addresses] = await Promise.all([
    getCartForActor(actor),
    listAddresses(actor),
  ]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          Checkout review
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Checkout</h1>
        <p className="mt-2 text-muted">
          Confirm your address and review the order summary. Payment is a
          placeholder on this preview — no live charges are taken.
        </p>
      </div>
      <CheckoutPanel initialCart={cart} initialAddresses={addresses} />
      <p className="text-sm">
        <Link href="/cart" className="underline">
          Back to cart
        </Link>
      </p>
    </main>
  );
}
