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
        <Link href="/seller/onboarding" className="underline">
          Seller onboarding
        </Link>
        {actorIsAdmin(actor) ? (
          <Link href="/admin/sellers" className="underline">
            Admin seller queue
          </Link>
        ) : null}
        <LogoutButton />
        <Link href="/" className="underline">
          Home
        </Link>
      </nav>
    </main>
  );
}
