import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { AccountHub } from "@/components/account-hub";
import { PageShell } from "@/components/ui/page-shell";
import { actorIsAdmin } from "@/modules/identity/policy";
import { getOptionalActor } from "@/modules/identity/service";
import { prisma } from "@/platform/db/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Account" };

export default async function AccountPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/account");
  }

  const [orderCount, addressCount, wishlistCount, openReturnCount] =
    await Promise.all([
      prisma.order.count({ where: { userId: actor.userId } }),
      prisma.customerAddress.count({ where: { userId: actor.userId } }),
      prisma.wishlistItem.count({ where: { userId: actor.userId } }),
      prisma.returnRequest.count({
        where: {
          userId: actor.userId,
          status: { in: ["requested", "approved", "received"] },
        },
      }),
    ]);

  return (
    <PageShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            Your account
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            Hello, {actor.displayName}
          </h1>
          <p className="mt-2 text-muted">{actor.email}</p>
        </div>
        <LogoutButton />
      </div>

      <AccountHub
        stats={{
          orderCount,
          addressCount,
          wishlistCount,
          openReturnCount,
        }}
      />

      <nav className="flex flex-wrap gap-3 border-t border-border pt-4 text-sm">
        <Link href="/cart" className="text-accent underline">
          Cart
        </Link>
        <Link href="/shop" className="text-accent underline">
          Continue shopping
        </Link>
        <Link href="/seller" className="text-accent underline">
          Seller dashboard
        </Link>
        {actorIsAdmin(actor) ? (
          <Link href="/admin/orders" className="text-accent underline">
            Admin
          </Link>
        ) : null}
      </nav>
    </PageShell>
  );
}
