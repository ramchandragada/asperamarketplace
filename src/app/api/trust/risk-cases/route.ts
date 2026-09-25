import { requireActor } from "@/modules/identity/service";
import { openRiskCaseSchema, updateRiskCaseSchema } from "@/modules/trust/schema";
import {
  listRiskCases,
  openRiskCase,
  updateRiskCase,
} from "@/modules/trust/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const cases = await listRiskCases(actor);
    return jsonOk({ cases }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const json = await request.json();
    if (json && typeof json === "object" && "riskCaseId" in json) {
      const body = updateRiskCaseSchema.parse(json);
      const riskCase = await updateRiskCase(actor, body, requestId);
      return jsonOk({ riskCase }, requestId, { message: "Risk case updated" });
    }
    const body = openRiskCaseSchema.parse(json);
    const riskCase = await openRiskCase(actor, body, requestId);
    return jsonOk({ riskCase }, requestId, {
      status: 201,
      message: "Risk case opened",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
