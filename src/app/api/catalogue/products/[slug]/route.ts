import { getPublicProductBySlug } from "@/modules/catalogue/service";
import { fail } from "@/platform/http/envelope";
import { REQUEST_ID_HEADER } from "@/platform/http/request-id";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const requestId = getRequestId(request);
  try {
    const { slug } = await context.params;
    const product = await getPublicProductBySlug(slug);
    if (!product) {
      return NextResponse.json(
        fail({
          requestId,
          code: "NOT_FOUND",
          message: "Product not found",
        }),
        { status: 404, headers: { [REQUEST_ID_HEADER]: requestId } },
      );
    }
    return jsonOk({ product }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
