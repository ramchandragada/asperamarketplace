import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { actorIsAdmin } from "@/modules/identity/policy";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account · Aspera Marketplace" };

export default async function AccountPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{actor.displayName}</h1>
        <p className="mt-2 text-muted">{actor.email}</p>
      </div>
      <section className="rounded-card border border-border bg-surface p-4">
        <h2 className="font-semibold">Roles</h2>
        <ul className="mt-2 text-sm">
          {actor.roles.map((role) => (
            <li key={`${role.key}:${role.sellerId ?? "global"}`}>
              {role.key}
              {role.sellerId ? ` (seller ${role.sellerId})` : ""}
            </li>
          ))}
        </ul>
      </section>
      <nav className="flex flex-col gap-2 text-sm">
        <Link href="/browse" className="underline">
          Browse catalogue
        </Link>
        <Link href="/cart" className="underline">
          Cart
        </Link>
        <Link href="/checkout" className="underline">
          Checkout
        </Link>
        <Link href="/orders" className="underline">
          Orders
        </Link>
        <Link href="/support" className="underline">
          Support / returns
        </Link>
        <Link href="/privacy" className="underline">
          Privacy requests
        </Link>
        <Link href="/seller/onboarding" className="underline">
          Seller onboarding
        </Link>
        <Link href="/seller/catalogue" className="underline">
          Seller catalogue
        </Link>
        <Link href="/seller/fulfilment" className="underline">
          Seller fulfilment
        </Link>
        <Link href="/seller/analytics" className="underline">
          Seller analytics
        </Link>
        {actorIsAdmin(actor) ? (
          <>
            <Link href="/admin/sellers" className="underline">
              Admin seller queue
            </Link>
            <Link href="/admin/products" className="underline">
              Admin product moderation
            </Link>
            <Link href="/admin/finance" className="underline">
              Admin finance
            </Link>
            <Link href="/admin/trust" className="underline">
              Admin trust & safety
            </Link>
            <Link href="/admin/analytics" className="underline">
              Admin analytics
            </Link>
          </>
        ) : null}
        <LogoutButton />
        <Link href="/" className="underline">
          Home
        </Link>
      </nav>
    </main>
  );
}
