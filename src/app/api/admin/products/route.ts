import { requireActor } from "@/modules/identity/service";
import {
  listAdminProducts,
  type AdminProductTab,
} from "@/modules/catalogue/service";
import { HttpValidationError } from "@/platform/http/errors";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";
import { isDbUuid } from "@/platform/validation/id";

export const dynamic = "force-dynamic";

const TABS = ["pending", "approved", "rejected", "paused"] as const;

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const url = new URL(request.url);
    const tabRaw = url.searchParams.get("tab") ?? "pending";
    const status = (TABS as readonly string[]).includes(tabRaw)
      ? (tabRaw as AdminProductTab)
      : "pending";
    const q = url.searchParams.get("q")?.trim() || undefined;
    const categoryId = url.searchParams.get("categoryId")?.trim() || undefined;
    const sellerId = url.searchParams.get("sellerId")?.trim() || undefined;
    if (categoryId && !isDbUuid(categoryId)) {
      throw new HttpValidationError("Invalid categoryId", {
        categoryId: ["Must be a valid UUID"],
      });
    }
    if (sellerId && !isDbUuid(sellerId)) {
      throw new HttpValidationError("Invalid sellerId", {
        sellerId: ["Must be a valid UUID"],
      });
    }
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, Number(url.searchParams.get("pageSize") ?? "20") || 20),
    );

    const result = await listAdminProducts(actor, {
      status,
      q,
      categoryId,
      sellerId,
      page,
      pageSize,
    });
    return jsonOk(
      {
        products: result.items,
        items: result.items,
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        pageCount: result.pageCount,
        counts: result.counts,
      },
      requestId,
    );
  } catch (error) {
    return jsonError(requestId, error);
  }
}
