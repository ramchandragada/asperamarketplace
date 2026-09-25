import Link from "next/link";
import { redirect } from "next/navigation";
import { CartPanel } from "@/components/cart-panel";
import { PageShell } from "@/components/ui/page-shell";
import { getCartForActor } from "@/modules/cart/service";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cart · Aspera Marketplace" };

export default async function CartPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/cart");
  }
  const cart = await getCartForActor(actor);

  return (
    <PageShell>
      <div>
        <h1 className="font-display text-3xl font-semibold">Your cart</h1>
        <p className="mt-2 text-muted">
          Review items, update quantities, and proceed to checkout.
        </p>
      </div>
      <CartPanel initialCart={cart} />
      <p className="text-sm">
        <Link href="/shop" className="text-accent underline">
          Continue shopping
        </Link>
      </p>
    </PageShell>
  );
}
