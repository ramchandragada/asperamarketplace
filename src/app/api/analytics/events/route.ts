import { getOptionalActor, requireActor } from "@/modules/identity/service";
import { trackEventSchema } from "@/modules/analytics/schema";
import { trackAnalyticsEvent } from "@/modules/analytics/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await getOptionalActor();
    const body = trackEventSchema.parse(await request.json());
    const event = await trackAnalyticsEvent(actor, body);
    return jsonOk({ event }, requestId, { status: 201, message: "Tracked" });
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    await requireActor();
    return jsonOk(
      {
        taxonomy: [
          "page_view",
          "product_view",
          "search",
          "add_to_cart",
          "checkout_start",
          "order_paid",
          "seller_dashboard_view",
        ],
      },
      requestId,
    );
  } catch (error) {
    return jsonError(requestId, error);
  }
}
