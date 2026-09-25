import { requireActor } from "@/modules/identity/service";
import {
  createComplianceEvidenceSchema,
  submitComplianceEvidenceSchema,
} from "@/modules/trust/schema";
import {
  createComplianceEvidence,
  listComplianceEvidence,
  submitComplianceEvidence,
} from "@/modules/trust/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const evidence = await listComplianceEvidence(actor);
    return jsonOk({ evidence }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const json = await request.json();
    if (json && typeof json === "object" && "evidenceId" in json) {
      const body = submitComplianceEvidenceSchema.parse(json);
      const evidence = await submitComplianceEvidence(actor, body, requestId);
      return jsonOk({ evidence }, requestId, {
        message: "Compliance evidence updated",
      });
    }
    const body = createComplianceEvidenceSchema.parse(json);
    const evidence = await createComplianceEvidence(actor, body, requestId);
    return jsonOk({ evidence }, requestId, {
      status: 201,
      message: "Compliance evidence drafted",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
