import { requireActor } from "@/modules/identity/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    return jsonOk(
      {
        displayName: actor.displayName,
        email: actor.email,
        userId: actor.userId,
      },
      requestId,
    );
  } catch (error) {
    return jsonError(requestId, error);
  }
}
