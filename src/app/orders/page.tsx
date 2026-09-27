import Link from "next/link";
import { redirect } from "next/navigation";
import { OrdersPanel } from "@/components/orders-panel";
import { listOrdersForActor } from "@/modules/orders/service";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders · Aspera Marketplace" };

export default async function OrdersPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login");
  }
  const orders = await listOrdersForActor(actor);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          Orders
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Your orders</h1>
        <p className="mt-2 text-muted">
          Mock payments only. Live Razorpay is not wired. Webhooks are signature
          checked and replay-safe.
        </p>
      </div>
      <OrdersPanel initialOrders={orders} />
      <p className="text-sm">
        <Link href="/account" className="underline">
          Back to account
        </Link>
      </p>
    </main>
  );
}
