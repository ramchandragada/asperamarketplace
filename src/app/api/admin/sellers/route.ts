import { requireActor } from "@/modules/identity/service";
import {
  listSellersForAdmin,
  type AdminSellerTab,
} from "@/modules/seller/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

const TABS: readonly AdminSellerTab[] = [
  "pending",
  "approved",
  "suspended",
  "all",
];

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const url = new URL(request.url);
    const rawTab = url.searchParams.get("tab") ?? undefined;
    const tab = TABS.includes(rawTab as AdminSellerTab)
      ? (rawTab as AdminSellerTab)
      : undefined;
    const search = url.searchParams.get("q") ?? undefined;
    const result = await listSellersForAdmin(actor, { tab, search });
    return jsonOk(result, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
