import { getOptionalActor } from "@/modules/identity/service";
import { AuthenticationError } from "@/modules/identity/policy";
import { cleanupCatalogueDataQuality } from "@/modules/admin/data-quality";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await getOptionalActor();
    if (!actor) throw new AuthenticationError("Sign in required");
    const result = await cleanupCatalogueDataQuality(actor, requestId);
    return jsonOk(result, requestId, {
      message: `Archived ${result.archivedCount} catalogue issue(s)`,
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
