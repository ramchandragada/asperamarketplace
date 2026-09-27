import { requireActor } from "@/modules/identity/service";
import {
  createExperimentSchema,
  updateExperimentSchema,
} from "@/modules/analytics/schema";
import {
  createExperiment,
  listExperiments,
  platformDashboard,
  sellerHealth,
  updateExperiment,
} from "@/modules/analytics/service";
import { AnalyticsValidationError } from "@/modules/analytics/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const url = new URL(request.url);
    const sellerId = url.searchParams.get("sellerId");
    if (sellerId) {
      const health = await sellerHealth(actor, sellerId);
      return jsonOk({ health }, requestId);
    }
    if (url.searchParams.get("experiments") === "1") {
      const experiments = await listExperiments(actor);
      return jsonOk({ experiments }, requestId);
    }
    const dashboard = await platformDashboard(actor);
    return jsonOk({ dashboard }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const json = await request.json();
    if (json && typeof json === "object" && "experimentId" in json) {
      const body = updateExperimentSchema.parse(json);
      const experiment = await updateExperiment(actor, body, requestId);
      return jsonOk({ experiment }, requestId, {
        message: "Experiment updated",
      });
    }
    const body = createExperimentSchema.parse(json);
    const experiment = await createExperiment(actor, body, requestId);
    return jsonOk({ experiment }, requestId, {
      status: 201,
      message: "Experiment drafted",
    });
  } catch (error) {
    if (error instanceof AnalyticsValidationError) {
      return jsonError(requestId, error);
    }
    return jsonError(requestId, error);
  }
}
