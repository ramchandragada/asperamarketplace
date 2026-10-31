import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { PageShell } from "@/components/ui/page-shell";
import { redirectToLogin } from "@/lib/login-redirect";
import { actorIsSellerStaff } from "@/modules/identity/policy";
import { getOptionalActor } from "@/modules/identity/service";
import { resolveSellerForActor } from "@/modules/seller/access";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getOptionalActor();
  if (!actor) {
    await redirectToLogin("/account");
  }
  if (!actor) return null;

  // Seller ops belong in Seller Central. Allow profile only for password/name.
  const sellerWorkspace = await resolveSellerForActor(actor, "dashboard.read");
  if (actorIsSellerStaff(actor) || sellerWorkspace) {
    const path = (await headers()).get("x-aspera-pathname") ?? "";
    const allowProfile =
      path === "/account/profile" || path.startsWith("/account/profile/");
    if (!allowProfile) {
      redirect("/seller");
    }
  }

  return (
    <PageShell>
      <div className="grid gap-6 md:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="md:sticky md:top-6 md:self-start">
          <AccountNav displayName={actor.displayName} />
        </aside>
        <div className="flex min-w-0 flex-col gap-8">{children}</div>
      </div>
    </PageShell>
  );
}
