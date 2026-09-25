import { z } from "zod";
import {
  addWishlistItem,
  listWishlistProductIds,
  listWishlistProducts,
  removeWishlistItem,
} from "@/modules/wishlist/service";
import { getOptionalActor } from "@/modules/identity/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await getOptionalActor();
    if (!actor) {
      return jsonError(requestId, Object.assign(new Error("Unauthorized"), { status: 401 }));
    }
    const url = new URL(request.url);
    if (url.searchParams.get("idsOnly") === "true") {
      const ids = await listWishlistProductIds(actor.userId);
      return jsonOk({ ids }, requestId);
    }
    const items = await listWishlistProducts(actor.userId);
    return jsonOk({ items }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

const bodySchema = z.object({
  productId: z.uuid(),
  action: z.enum(["add", "remove"]).default("add"),
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await getOptionalActor();
    if (!actor) {
      return Response.json(
        { message: "Sign in to save wishlist items", code: "UNAUTHORIZED" },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }
    const json = bodySchema.parse(await request.json());
    if (json.action === "remove") {
      await removeWishlistItem(actor.userId, json.productId);
      return jsonOk({ saved: false }, requestId);
    }
    await addWishlistItem(actor.userId, json.productId);
    return jsonOk({ saved: true }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
