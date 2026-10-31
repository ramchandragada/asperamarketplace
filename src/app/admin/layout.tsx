import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { OperatorChrome } from "@/components/operator-chrome";
import { PageShell } from "@/components/ui/page-shell";
import { redirectToLogin } from "@/lib/login-redirect";
import {
  actorHasSellerStaffRole,
  actorIsAdmin,
  sellerIdsForCapability,
} from "@/modules/identity/policy";
import {
  adminHasTotpEnabled,
  adminTotpRequiredInProduction,
  getOptionalActor,
} from "@/modules/identity/service";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getOptionalActor();
  if (!actor) {
    await redirectToLogin("/admin");
  }
  // redirectToLogin never returns; narrow for TypeScript.
  if (!actor) return null;
  if (!actorIsAdmin(actor)) {
    redirect("/account");
  }

  const headerList = await headers();
  const path = headerList.get("x-aspera-pathname") ?? "";
  const onSecurityPage =
    path === "/admin/security" || path.startsWith("/admin/security/");

  if (adminTotpRequiredInProduction(actor) && !onSecurityPage) {
    const enabled = await adminHasTotpEnabled(actor.userId);
    if (!enabled) {
      redirect("/admin/security");
    }
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
    <OperatorChrome
      surface="admin"
      title={actor.displayName}
      showAdmin
      showSeller={showSeller}
    >
      <PageShell>
        <div className="grid gap-6 md:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="md:sticky md:top-6 md:self-start">
            <AdminNav adminName={actor.displayName} showSeller={showSeller} />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </PageShell>
    </OperatorChrome>
  );
}
