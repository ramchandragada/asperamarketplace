import Link from "next/link";
import { PrivacyRequestPanel } from "@/components/privacy-request-panel";
import { PageShell } from "@/components/ui/page-shell";
import { getOptionalActor } from "@/modules/identity/service";
import { listPrivacyRequests } from "@/modules/trust/service";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Privacy · Aspera Marketplace",
  description: "How Aspera Marketplace handles personal data and privacy requests.",
};

export default async function PrivacyPage() {
  const actor = await getOptionalActor();
  const requests = actor ? await listPrivacyRequests(actor) : [];

  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">Privacy</h1>
      <p className="mt-2 text-muted">
        Aspera Marketplace collects account, order, and delivery details only to
        run the storefront and support your purchases. We do not sell personal
        data.
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted">
        <li>Account email and profile details for sign-in and order updates</li>
        <li>Addresses and phone numbers for delivery and returns</li>
        <li>Order history for support, refunds, and seller payouts</li>
      </ul>
      <p className="mt-4 text-sm text-muted">
        Full legal policy copy is coming soon. For access, correction, or erasure
        requests, use the form below after signing in.
      </p>

      {actor ? (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Privacy requests</h2>
          <p className="mt-1 text-sm text-muted">
            Submit access, erasure, correction, or portability requests.
          </p>
          <div className="mt-4">
            <PrivacyRequestPanel initialRequests={requests} />
          </div>
        </div>
      ) : (
        <p className="mt-8 rounded-[var(--radius)] border border-border bg-surface p-4 text-sm">
          <Link href="/login?next=/privacy" className="font-medium text-accent underline">
            Sign in
          </Link>{" "}
          to submit a privacy request.
        </p>
      )}

      <p className="mt-6 text-sm">
        <Link href="/help" className="text-accent underline">
          Help centre
        </Link>
      </p>
    </PageShell>
  );
}
