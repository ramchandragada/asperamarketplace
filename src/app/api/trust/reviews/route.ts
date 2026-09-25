import { requireActor } from "@/modules/identity/service";
import {
  createReviewSchema,
  moderateReviewSchema,
} from "@/modules/trust/schema";
import {
  createProductReview,
  listReviewsForModeration,
  moderateReview,
} from "@/modules/trust/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const reviews = await listReviewsForModeration(actor);
    return jsonOk({ reviews }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const json = await request.json();
    if (json && typeof json === "object" && "reviewId" in json) {
      const body = moderateReviewSchema.parse(json);
      const review = await moderateReview(actor, body, requestId);
      return jsonOk({ review }, requestId, { message: "Review moderated" });
    }
    const body = createReviewSchema.parse(json);
    const review = await createProductReview(actor, body, requestId);
    return jsonOk({ review }, requestId, {
      status: 201,
      message: "Review submitted for moderation",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
