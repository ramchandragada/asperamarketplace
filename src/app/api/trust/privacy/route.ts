import { requireActor } from "@/modules/identity/service";
import {
  createPrivacyRequestSchema,
  updatePrivacyRequestSchema,
} from "@/modules/trust/schema";
import {
  createPrivacyRequest,
  listPrivacyRequests,
  updatePrivacyRequest,
} from "@/modules/trust/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const requests = await listPrivacyRequests(actor);
    return jsonOk({ requests }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const json = await request.json();
    if (json && typeof json === "object" && "privacyRequestId" in json) {
      const body = updatePrivacyRequestSchema.parse(json);
      const privacyRequest = await updatePrivacyRequest(actor, body, requestId);
      return jsonOk({ privacyRequest }, requestId, {
        message: "Privacy request updated",
      });
    }
    const body = createPrivacyRequestSchema.parse(json);
    const privacyRequest = await createPrivacyRequest(actor, body, requestId);
    return jsonOk({ privacyRequest }, requestId, {
      status: 201,
      message: "Privacy request received",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
