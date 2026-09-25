import Link from "next/link";
import { redirect } from "next/navigation";
import { SupportCarePanel } from "@/components/support-care-panel";
import { getOptionalActor } from "@/modules/identity/service";
import { listTicketsForActor } from "@/modules/fulfilment/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Support · Aspera Marketplace" };

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; sellerId?: string }>;
}) {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login");
  }
  const params = await searchParams;
  const tickets = await listTicketsForActor(actor);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          Care
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Support</h1>
        <p className="mt-2 text-muted">
          Open tickets, request returns after delivery, or escalate a dispute.
        </p>
      </div>
      <SupportCarePanel
        initialTickets={tickets.map((ticket) => ({
          ...ticket,
          createdAt: ticket.createdAt.toISOString(),
        }))}
        defaultOrderId={params.orderId}
        defaultSellerId={params.sellerId}
      />
      <p className="text-sm">
        <Link href="/orders" className="underline">
          Orders
        </Link>
        {" · "}
        <Link href="/account" className="underline">
          Account
        </Link>
      </p>
    </main>
  );
}
