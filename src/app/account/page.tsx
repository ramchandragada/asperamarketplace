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

const TABS = ["orders", "addresses", "profile"] as const;

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/account");
  }

  const params = await searchParams;
  const initialTab = (TABS as readonly string[]).includes(params.tab ?? "")
    ? (params.tab as (typeof TABS)[number])
    : "orders";

  const [orders, addresses] = await Promise.all([
    prisma.order.findMany({
      where: { userId: actor.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        totalPaise: true,
        createdAt: true,
      },
    }),
    prisma.customerAddress.findMany({
      where: { userId: actor.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      take: 20,
    }),
  ]);

  return (
    <PageShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">My account</h1>
          <p className="mt-2 text-muted">
            {actor.displayName} · {actor.email}
          </p>
        </div>
        <LogoutButton />
      </div>

      <AccountHub
        initialTab={initialTab}
        orders={orders.map((order) => ({
          id: order.id,
          status: order.status,
          totalPaise: order.totalPaise,
          createdAt: order.createdAt.toISOString(),
        }))}
        addresses={addresses.map((address) => ({
          id: address.id,
          label: address.label,
          fullName: address.fullName,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          isDefault: address.isDefault,
        }))}
        profile={{
          displayName: actor.displayName,
          email: actor.email,
        }}
      />

      <nav className="flex flex-wrap gap-3 text-sm">
        <Link href="/wishlist" className="text-accent underline">
          Wishlist
        </Link>
        <Link href="/cart" className="text-accent underline">
          Cart
        </Link>
        <Link href="/orders" className="text-accent underline">
          All orders
        </Link>
        <Link href="/account?tab=addresses" className="text-accent underline">
          Addresses
        </Link>
        <Link href="/seller" className="text-accent underline">
          Seller dashboard
        </Link>
        {actorIsAdmin(actor) ? (
          <Link href="/admin" className="text-accent underline">
            Admin
          </Link>
        ) : null}
      </nav>
    </PageShell>
  );
}
