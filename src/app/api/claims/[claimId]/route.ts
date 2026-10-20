import { requireActor } from "@/modules/identity/service";
import { getProtectionClaimForActor } from "@/modules/protection/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ claimId: string }> },
) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const { claimId } = await context.params;
    const claim = await getProtectionClaimForActor(actor, claimId);
    return jsonOk({ claim }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
