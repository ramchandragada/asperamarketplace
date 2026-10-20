import { requireActor } from "@/modules/identity/service";
import { createProtectionClaimSchema } from "@/modules/protection/schema";
import {
  createProtectionClaim,
  listProtectionClaimsForActor,
} from "@/modules/protection/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const claims = await listProtectionClaimsForActor(actor);
    return jsonOk({ claims }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = createProtectionClaimSchema.parse(await request.json());
    const claim = await createProtectionClaim(actor, body, requestId);
    return jsonOk({ claim }, requestId, {
      status: 201,
      message: "Buyer Protection claim submitted",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
