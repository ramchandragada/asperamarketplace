import { z } from "zod";
import {
  beginAdminTotpEnrollment,
  confirmAdminTotpEnrollment,
  getOptionalActor,
} from "@/modules/identity/service";
import { AuthenticationError } from "@/modules/identity/policy";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

const confirmSchema = z.object({
  code: z.string().min(6).max(8),
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await getOptionalActor();
    if (!actor) throw new AuthenticationError("Sign in required");
    const enrollment = await beginAdminTotpEnrollment(actor);
    return jsonOk(enrollment, requestId, { message: "Authenticator setup started" });
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function PUT(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await getOptionalActor();
    if (!actor) throw new AuthenticationError("Sign in required");
    const body = confirmSchema.parse(await request.json());
    const result = await confirmAdminTotpEnrollment(actor, body.code);
    return jsonOk(result, requestId, { message: "Authenticator enabled" });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
