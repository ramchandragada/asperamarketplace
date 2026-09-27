import { getOptionalActor } from "@/modules/identity/service";
import { getRequestId, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const actor = await getOptionalActor();
  return jsonOk(
    actor
      ? {
          authenticated: true,
          userId: actor.userId,
          email: actor.email,
          displayName: actor.displayName,
          roles: actor.roles,
        }
      : { authenticated: false },
    requestId,
  );
}
