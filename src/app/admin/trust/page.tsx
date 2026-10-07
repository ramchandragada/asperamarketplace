import { TrustOpsPanel } from "@/components/trust-ops-panel";
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
export const metadata = { title: "Trust & safety" };

export default async function AdminTrustPage() {
  const actor = await getOptionalActor();

  const [summary, risk, counterfeit, reviews, privacy, evidence] =
    await Promise.all([
      trustOpsSummary(actor!),
      listRiskCases(actor!),
      listCounterfeitCases(actor!),
      listReviewsForModeration(actor!),
      listPrivacyRequests(actor!),
      listComplianceEvidence(actor!),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Trust & safety</h1>
        <p className="mt-2 text-muted">
          Risk cases, counterfeit queue, review moderation, privacy requests,
          and compliance evidence.
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
    </div>
  );
}
