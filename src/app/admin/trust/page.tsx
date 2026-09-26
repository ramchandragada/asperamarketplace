import Link from "next/link";
import { redirect } from "next/navigation";
import { TrustOpsPanel } from "@/components/trust-ops-panel";
import { actorIsAdmin } from "@/modules/identity/policy";
import { getOptionalActor } from "@/modules/identity/service";
import {
  listComplianceEvidence,
  listCounterfeitCases,
  listPrivacyRequests,
  listReviewsForModeration,
  listRiskCases,
  trustOpsSummary,
} from "@/modules/trust/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Trust & safety · Aspera Marketplace" };

export default async function AdminTrustPage() {
  const actor = await getOptionalActor();
  if (!actor) redirect("/login");
  if (!actorIsAdmin(actor)) redirect("/account");

  const [summary, risk, counterfeit, reviews, privacy, evidence] =
    await Promise.all([
      trustOpsSummary(actor),
      listRiskCases(actor),
      listCounterfeitCases(actor),
      listReviewsForModeration(actor),
      listPrivacyRequests(actor),
      listComplianceEvidence(actor),
    ]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Trust & safety</h1>
        <p className="mt-2 text-muted">
          Risk cases, counterfeit queue, review moderation, privacy ops, and
          compliance register evidence. Legal assumptions stay open.
        </p>
      </div>
      <TrustOpsPanel
        initialSummary={summary}
        initialRisk={risk}
        initialCounterfeit={counterfeit}
        initialReviews={reviews}
        initialPrivacy={privacy}
        initialEvidence={evidence}
      />
      <p className="text-sm">
        <Link href="/admin/finance" className="underline">
          Finance
        </Link>
        {" · "}
        <Link href="/account" className="underline">
          Account
        </Link>
      </p>
    </main>
  );
}
