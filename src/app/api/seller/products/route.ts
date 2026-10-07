import { requireActor } from "@/modules/identity/service";
import { createProductSchema } from "@/modules/catalogue/schema";
import {
  createProductDraft,
  listSellerProducts,
} from "@/modules/catalogue/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const url = new URL(request.url);
    const sellerId = url.searchParams.get("sellerId");
    if (!sellerId) {
      return jsonError(requestId, {
        name: "ValidationError",
        message: "sellerId is required",
        code: "VALIDATION_ERROR",
      });
    }
    const status = url.searchParams.get("status") as
      | "draft"
      | "submitted"
      | "approved"
      | "rejected"
      | "archived"
      | null;
    const stock = url.searchParams.get("stock") as "in" | "low" | "out" | null;
    const result = await listSellerProducts(actor, sellerId, {
      q: url.searchParams.get("q") ?? undefined,
      status: status ?? undefined,
      stock: stock ?? undefined,
      page: Number(url.searchParams.get("page") ?? "1"),
      pageSize: Number(url.searchParams.get("pageSize") ?? "25"),
    });
    return jsonOk({ products: result.items, ...result }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = createProductSchema.parse(await request.json());
    const created = await createProductDraft(actor, body, requestId);
    return jsonOk(created, requestId, {
      status: 201,
      message: "Product draft created",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
