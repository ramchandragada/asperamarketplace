import Link from "next/link";
import { SupportCarePanel } from "@/components/support-care-panel";
import { PageShell } from "@/components/ui/page-shell";
import { getOptionalActor } from "@/modules/identity/service";
import { listTicketsForActor } from "@/modules/fulfilment/service";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Support · Aspera Marketplace",
  description: "Get help with orders, returns, and seller questions on Aspera.",
};

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; sellerId?: string }>;
}) {
  const actor = await getOptionalActor();
  const params = await searchParams;
  const tickets = actor ? await listTicketsForActor(actor) : [];

  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">Customer support</h1>
      <p className="mt-2 text-muted">
        Need help with an order, return, or delivery? Browse common topics or
        open a ticket when you are signed in.
      </p>
      <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <li>
          <Link href="/help" className="font-medium text-accent underline">
            Help centre
          </Link>
        </li>
        <li>
          <Link href="/returns" className="font-medium text-accent underline">
            Return policy
          </Link>
        </li>
        <li>
          <Link href="/shipping" className="font-medium text-accent underline">
            Shipping info
          </Link>
        </li>
        <li>
          <Link href="/orders" className="font-medium text-accent underline">
            Track order
          </Link>
        </li>
      </ul>

      {actor ? (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Your tickets</h2>
          <p className="mt-1 text-sm text-muted">
            Open tickets, request returns after delivery, or escalate a dispute.
          </p>
          <div className="mt-4">
            <SupportCarePanel
              initialTickets={tickets.map((ticket) => ({
                ...ticket,
                createdAt: ticket.createdAt.toISOString(),
              }))}
              defaultOrderId={params.orderId}
              defaultSellerId={params.sellerId}
            />
          </div>
        </div>
      ) : (
        <p className="mt-8 rounded-[var(--radius)] border border-border bg-surface p-4 text-sm">
          <Link
            href={`/login?next=${encodeURIComponent(
              params.orderId
                ? `/support?orderId=${params.orderId}${params.sellerId ? `&sellerId=${params.sellerId}` : ""}`
                : "/support",
            )}`}
            className="font-medium text-accent underline"
          >
            Sign in
          </Link>{" "}
          to open a support ticket or request a return.
        </p>
      )}
    </PageShell>
  );
}
