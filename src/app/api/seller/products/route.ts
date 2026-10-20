import { z } from "zod";
import { requireActor } from "@/modules/identity/service";
import { createProductSchema } from "@/modules/catalogue/schema";
import {
  createProductDraft,
  listSellerProducts,
} from "@/modules/catalogue/service";
import { resolveSellerForActor } from "@/modules/seller/access";
import { AuthorizationError } from "@/modules/identity/policy";
import { assertUuid } from "@/platform/http/errors";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

const listQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .catch(1)
    .transform((value) => Math.max(1, value))
    .default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(25),
  q: z.string().trim().max(120).optional(),
  status: z
    .enum(["draft", "submitted", "approved", "rejected", "archived"])
    .optional(),
  stock: z.enum(["in", "low", "out"]).optional(),
});

async function resolveCatalogueSellerId(
  actor: Awaited<ReturnType<typeof requireActor>>,
  preferred: string | null,
) {
  if (preferred) {
    assertUuid(preferred, "sellerId");
    const seller = await resolveSellerForActor(
      actor,
      "catalogue.write",
      preferred,
    );
    if (!seller) {
      throw new AuthorizationError("Seller catalogue access denied");
    }
    return seller.id;
  }
  const seller = await resolveSellerForActor(actor, "catalogue.write");
  if (!seller) {
    throw new AuthorizationError("No approved seller workspace for catalogue");
  }
  return seller.id;
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const url = new URL(request.url);
    const sellerId = await resolveCatalogueSellerId(
      actor,
      url.searchParams.get("sellerId"),
    );
    const parsed = listQuerySchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") || undefined,
      stock: url.searchParams.get("stock") || undefined,
    });
    if (!parsed.success) {
      throw parsed.error;
    }
    const result = await listSellerProducts(actor, sellerId, parsed.data);
    const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize));
    const page = Math.min(result.page, pageCount);
    const items =
      page === result.page
        ? result.items
        : (
            await listSellerProducts(actor, sellerId, {
              ...parsed.data,
              page,
            })
          ).items;
    return jsonOk(
      {
        products: items,
        items,
        page,
        pageSize: result.pageSize,
        total: result.total,
        pageCount,
        sellerId,
      },
      requestId,
    );
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const raw = await request.json();
    const body = createProductSchema.parse(raw);
    const created = await createProductDraft(actor, body, requestId);
    return jsonOk(created, requestId, {
      status: 201,
      message: "Product draft created",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
