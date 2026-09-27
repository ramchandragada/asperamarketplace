import { requireActor } from "@/modules/identity/service";
import {
  reportCounterfeitSchema,
  reviewCounterfeitSchema,
} from "@/modules/trust/schema";
import {
  listCounterfeitCases,
  reportCounterfeit,
  reviewCounterfeit,
} from "@/modules/trust/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const cases = await listCounterfeitCases(actor);
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
    if (json && typeof json === "object" && "caseId" in json) {
      const body = reviewCounterfeitSchema.parse(json);
      const counterfeitCase = await reviewCounterfeit(actor, body, requestId);
      return jsonOk({ counterfeitCase }, requestId, {
        message: "Counterfeit case reviewed",
      });
    }
    const body = reportCounterfeitSchema.parse(json);
    const counterfeitCase = await reportCounterfeit(actor, body, requestId);
    return jsonOk({ counterfeitCase }, requestId, {
      status: 201,
      message: "Counterfeit report filed",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
