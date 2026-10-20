import { requireActor, updateActorProfile } from "@/modules/identity/service";
import { updateProfileSchema } from "@/modules/identity/schema";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = updateProfileSchema.parse(await request.json());
    const profile = await updateActorProfile(actor, body, requestId);
    return jsonOk({ profile }, requestId, { message: "Profile updated" });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
