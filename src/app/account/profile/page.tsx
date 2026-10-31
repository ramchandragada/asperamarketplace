import { redirect } from "next/navigation";
import { AccountProfileForm } from "@/components/account-profile-form";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Login & security" };

export default async function AccountProfilePage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/account/profile");
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          Account settings
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          Login & security
        </h1>
        <p className="mt-2 text-muted">
          Edit your display name. Email changes will require verification in a
          later release.
        </p>
      </div>

      <AccountProfileForm
        initialDisplayName={actor.displayName}
        email={actor.email}
      />

      <section className="rounded-[var(--radius)] border border-border bg-surface p-5 text-sm">
        <h2 className="font-semibold">FAQs</h2>
        <ul className="mt-3 flex flex-col gap-2 text-muted">
          <li>
            What happens when I update my name? It appears on your account home
            and future order communications.
          </li>
          <li>
            Can I change my email? Not yet — contact support if you need to
            migrate an account.
          </li>
        </ul>
      </section>
    </div>
  );
}
