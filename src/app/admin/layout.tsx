import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { PageShell } from "@/components/ui/page-shell";
import {
  actorHasSellerStaffRole,
  actorIsAdmin,
  sellerIdsForCapability,
} from "@/modules/identity/policy";
import { getOptionalActor } from "@/modules/identity/service";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/admin");
  }
  if (!actorIsAdmin(actor)) {
    redirect("/account");
  }
  const showSeller =
    sellerIdsForCapability(actor, "dashboard.read").length > 0 ||
    actor.roles.some(
      (role) => role.key === "seller_owner" || role.sellerId != null,
    ) ||
    actor.roles.some((role) =>
      role.sellerId ? actorHasSellerStaffRole(actor, role.sellerId) : false,
    );

  return (
    <PageShell>
      <div className="grid gap-6 md:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="md:sticky md:top-6 md:self-start">
          <AdminNav adminName={actor.displayName} showSeller={showSeller} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </PageShell>
  );
}
