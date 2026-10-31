import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import {
  AttentionList,
  DashboardCard,
  StatTile,
  type AttentionItem,
} from "@/components/dashboard/dashboard-kit";
import { actorIsSellerStaff } from "@/modules/identity/policy";
import { getOptionalActor } from "@/modules/identity/service";
import { formatPaise } from "@/modules/catalogue/helpers";
import { prisma } from "@/platform/db/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Account" };

const statusTone: Record<string, string> = {
  awaiting_payment: "bg-warning-soft text-warning",
  paid: "bg-accent-soft text-accent",
  fulfilled: "bg-success-soft text-success",
  partially_cancelled: "bg-warning-soft text-warning",
  cancelled: "bg-danger-soft text-danger",
};

function BagIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 8h12l-1 11H7L6 8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function RupeeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 5h10M7 9h10M7 5c6 0 7 8 0 8h3l5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 20s-7-4.35-7-9.2A3.8 3.8 0 0 1 12 7.5a3.8 3.8 0 0 1 7 3.3C19 15.65 12 20 12 20z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function ReturnIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 10h11a5 5 0 0 1 0 10H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 6l-3 4 3 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function AccountPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/account");
  }

  // Seller staff belong in Seller Central — not the shopper hub with Buy Again.
  if (actorIsSellerStaff(actor)) {
    redirect("/seller");
  }

  const [
    orderCount,
    wishlistCount,
    openReturnCount,
    spend,
    awaitingDelivery,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { userId: actor.userId } }),
    prisma.wishlistItem.count({ where: { userId: actor.userId } }),
    prisma.returnRequest.count({
      where: {
        userId: actor.userId,
        status: { in: ["requested", "approved", "received"] },
      },
    }),
    prisma.order.aggregate({
      where: { userId: actor.userId, paidAt: { not: null } },
      _sum: { totalPaise: true },
    }),
    prisma.orderFulfilmentGroup.count({
      where: {
        order: { userId: actor.userId },
        status: { in: ["pending", "processing", "shipped"] },
      },
    }),
    prisma.order.findMany({
      where: { userId: actor.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalPaise: true,
        createdAt: true,
      },
    }),
  ]);

  const totalSpentPaise = spend._sum.totalPaise ?? 0;

  const attention: AttentionItem[] = [];
  if (awaitingDelivery > 0)
    attention.push({
      id: "transit",
      severity: "info",
      title: `${awaitingDelivery} item group(s) on the way`,
      detail: "Track your shipments and delivery status",
      cta: { label: "Track", href: "/orders" },
    });
  if (openReturnCount > 0)
    attention.push({
      id: "returns",
      severity: "warning",
      title: `${openReturnCount} return(s) in progress`,
      detail: "Check the status of your return requests",
      cta: { label: "View", href: "/account/returns" },
    });

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
            Overview
          </p>
          <h1 className="mt-1 font-display text-[26px] font-semibold tracking-tight">
            Hello, {actor.displayName}
          </h1>
          <p className="mt-1 text-sm text-muted">{actor.email}</p>
        </div>
        <LogoutButton />
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Orders"
          value={String(orderCount)}
          icon={<BagIcon />}
          footnote="Lifetime"
        />
        <StatTile
          label="Total spent"
          value={formatPaise(totalSpentPaise)}
          icon={<RupeeIcon />}
          footnote="Paid orders"
        />
        <StatTile
          label="Wishlist"
          value={String(wishlistCount)}
          icon={<HeartIcon />}
          footnote="Saved items"
        />
        <StatTile
          label="Open returns"
          value={String(openReturnCount)}
          icon={<ReturnIcon />}
          flag={
            openReturnCount > 0
              ? { text: "In progress", tone: "warning" }
              : null
          }
          footnote={openReturnCount === 0 ? "None" : undefined}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <DashboardCard
          title="Recent orders"
          action={{ label: "View all", href: "/orders" }}
        >
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-start gap-2 py-2">
              <p className="text-sm text-muted">
                You haven’t placed any orders yet.
              </p>
              <Link
                href="/shop"
                className="rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-[11px] tracking-wide text-muted uppercase">
                  <th className="py-2 font-medium">Order</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Total</th>
                  <th className="py-2 text-right font-medium">Placed</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-t border-border text-[13px]">
                    <td className="py-2.5">
                      <Link
                        href={`/orders/${o.id}`}
                        className="font-semibold text-accent hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          statusTone[o.status] ?? "bg-accent-soft text-accent"
                        }`}
                      >
                        ● {o.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-semibold">
                      {formatPaise(o.totalPaise)}
                    </td>
                    <td className="py-2.5 text-right text-muted">
                      {new Date(o.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DashboardCard>

        <DashboardCard title="Needs attention" aside={`${attention.length} open`}>
          <AttentionList
            items={attention}
            allClear="Nothing needs your attention right now."
          />
        </DashboardCard>
      </section>

      <nav className="flex flex-wrap gap-4 border-t border-border pt-4 text-sm">
        <Link href="/cart" className="font-medium text-accent hover:underline">
          Cart
        </Link>
        <Link href="/shop" className="font-medium text-accent hover:underline">
          Continue shopping
        </Link>
      </nav>
    </>
  );
}
