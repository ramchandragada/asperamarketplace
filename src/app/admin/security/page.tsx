import { AdminTotpPanel } from "@/components/admin-totp-panel";
import { redirectToLogin } from "@/lib/login-redirect";
import {
  adminHasTotpEnabled,
  adminTotpRequiredInProduction,
  getOptionalActor,
} from "@/modules/identity/service";
import { actorIsAdmin } from "@/modules/identity/policy";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin security" };

export default async function AdminSecurityPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    await redirectToLogin("/admin/security");
  }
  if (!actor) return null;
  if (!actorIsAdmin(actor)) {
    redirect("/account");
  }
  const enabled = await adminHasTotpEnabled(actor.userId);
  const required = adminTotpRequiredInProduction(actor);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Admin security</h1>
        <p className="mt-2 text-muted">
          {required
            ? "Protect privileged admin sessions with a time-based authenticator."
            : "Optional authenticator setup. Sign-in does not require TOTP until ENABLE_ADMIN_TOTP is enabled in production."}
        </p>
      </div>
      <AdminTotpPanel enabled={enabled} required={required} />
    </div>
  );
}
