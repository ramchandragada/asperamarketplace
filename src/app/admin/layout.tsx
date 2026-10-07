import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { PageShell } from "@/components/ui/page-shell";
import { actorIsAdmin } from "@/modules/identity/policy";
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

  return (
    <PageShell>
      <div className="grid gap-6 md:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="md:sticky md:top-6 md:self-start">
          <AdminNav adminName={actor.displayName} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </PageShell>
  );
}
