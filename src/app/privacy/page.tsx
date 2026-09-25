import Link from "next/link";
import { redirect } from "next/navigation";
import { PrivacyRequestPanel } from "@/components/privacy-request-panel";
import { getOptionalActor } from "@/modules/identity/service";
import { listPrivacyRequests } from "@/modules/trust/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Privacy · Aspera Marketplace" };

export default async function PrivacyPage() {
  const actor = await getOptionalActor();
  if (!actor) redirect("/login");
  const requests = await listPrivacyRequests(actor);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Privacy requests</h1>
        <p className="mt-2 text-muted">
          Submit access, erasure, correction, or portability requests. Fulfilment
          is operational tracking only; legal counsel remains required.
        </p>
      </div>
      <PrivacyRequestPanel initialRequests={requests} />
      <p className="text-sm">
        <Link href="/account" className="underline">
          Account
        </Link>
      </p>
    </main>
  );
}
