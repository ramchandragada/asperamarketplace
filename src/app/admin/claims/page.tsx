import { AdminClaimsPanel } from "@/components/admin-claims-panel";
import { getOptionalActor } from "@/modules/identity/service";
import { listProtectionClaimsForAdmin } from "@/modules/protection/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Buyer Protection claims" };

export default async function AdminClaimsPage() {
  const actor = await getOptionalActor();
  const claims = await listProtectionClaimsForAdmin(actor!);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Buyer Protection claims</h1>
        <p className="mt-2 text-muted">
          Review eligibility evidence, approve refunds, or reject with a note.
        </p>
      </div>
      <AdminClaimsPanel
        initialClaims={claims.map((claim) => ({
          id: claim.id,
          claimType: claim.claimType,
          status: claim.status,
          description: claim.description,
          resolutionNote: claim.resolutionNote,
          sellerDebitPaise: claim.sellerDebitPaise,
          createdAt: claim.createdAt.toISOString(),
          decidedAt: claim.decidedAt?.toISOString() ?? null,
          orderNumber: claim.order.orderNumber,
          orderStatus: claim.order.status,
          sellerName: claim.seller.tradeName ?? claim.seller.legalName,
          buyerName: claim.user.displayName,
          buyerEmail: claim.user.email,
        }))}
      />
    </div>
  );
}
