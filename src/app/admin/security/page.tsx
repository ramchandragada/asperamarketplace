import { redirect } from "next/navigation";
import { AdminTotpPanel } from "@/components/admin-totp-panel";
import {
  adminHasTotpEnabled,
  getOptionalActor,
} from "@/modules/identity/service";
import { actorIsAdmin } from "@/modules/identity/policy";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin security" };

export default async function AdminSecurityPage() {
  const actor = await getOptionalActor();
  if (!actor || !actorIsAdmin(actor)) {
    redirect("/login?next=/admin/security");
  }
  const enabled = await adminHasTotpEnabled(actor.userId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Admin security</h1>
        <p className="mt-2 text-muted">
          Protect privileged admin sessions with a time-based authenticator.
        </p>
      </div>
      <AdminTotpPanel enabled={enabled} />
    </div>
  );
}
