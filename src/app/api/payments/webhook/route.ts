import { processPaymentWebhook } from "@/modules/orders/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const rawBody = await request.text();
    const signatureHeader =
      request.headers.get("x-aspera-mock-signature") ??
      request.headers.get("x-signature") ??
      "";
    const result = await processPaymentWebhook({
      rawBody,
      signatureHeader,
      correlationId: requestId,
    });
    return jsonOk(result, requestId, {
      message: result.replayed
        ? "Webhook replay ignored"
        : "Webhook processed",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
