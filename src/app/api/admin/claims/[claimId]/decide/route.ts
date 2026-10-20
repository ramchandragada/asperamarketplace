import { requireActor } from "@/modules/identity/service";
import { decideProtectionClaimSchema } from "@/modules/protection/schema";
import { decideProtectionClaim } from "@/modules/protection/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ claimId: string }> },
) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const { claimId } = await context.params;
    const body = decideProtectionClaimSchema.parse({
      ...(await request.json()),
      claimId,
    });
    const claim = await decideProtectionClaim(actor, body, requestId);
    return jsonOk({ claim }, requestId, { message: "Claim updated" });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
