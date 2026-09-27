import { buildHealthData, checkDatabaseStatus } from "@/platform/health";
import { ok } from "@/platform/http/envelope";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/platform/http/request-id";
import { logger } from "@/platform/logging/logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = resolveRequestId(request.headers.get(REQUEST_ID_HEADER));
  const database = await checkDatabaseStatus();
  const body = ok(buildHealthData(database), requestId, "Service is ready");
  const status = database === "unavailable" ? 503 : 200;

  logger.info("health.checked", {
    requestId,
    path: "/api/health",
    database,
    status,
  });

  return Response.json(body, {
    status,
    headers: {
      [REQUEST_ID_HEADER]: requestId,
      "cache-control": "no-store",
    },
  });
}
