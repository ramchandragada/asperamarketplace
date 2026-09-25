import Link from "next/link";
import { redirect } from "next/navigation";
import { CartPanel } from "@/components/cart-panel";
import { getCartForActor } from "@/modules/cart/service";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cart · Aspera Marketplace" };

export default async function CartPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login");
  }
  const cart = await getCartForActor(actor);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          Aspera Marketplace
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Your cart</h1>
        <p className="mt-2 text-muted">
          Quantities are checked against server inventory. Line prices come from
          the catalogue, not the browser.
        </p>
      </div>
      <CartPanel initialCart={cart} />
      <p className="text-sm">
        <Link href="/browse" className="underline">
          Continue browsing
        </Link>
      </p>
    </main>
  );
}
