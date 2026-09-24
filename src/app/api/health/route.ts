import { buildHealthData } from "@/platform/health";
import { ok } from "@/platform/http/envelope";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/platform/http/request-id";
import { logger } from "@/platform/logging/logger";

export function GET(request: Request) {
  const requestId = resolveRequestId(request.headers.get(REQUEST_ID_HEADER));
  logger.info("health.checked", { requestId, path: "/api/health" });
  return Response.json(ok(buildHealthData(), requestId, "Service is ready"), {
    headers: {
      [REQUEST_ID_HEADER]: requestId,
      "cache-control": "no-store",
    },
  });
}
