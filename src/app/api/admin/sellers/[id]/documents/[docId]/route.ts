import { NextResponse } from "next/server";
import { requireActor } from "@/modules/identity/service";
import { getSellerDocumentForAdmin } from "@/modules/seller/service";
import { assertUuid } from "@/platform/http/errors";
import { getRequestId, jsonError } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; docId: string }> },
) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const { id: sellerId, docId } = await context.params;
    assertUuid(sellerId, "sellerId");
    assertUuid(docId, "docId");

    const { document, bytes } = await getSellerDocumentForAdmin(
      actor,
      sellerId,
      docId,
    );

    const headers = new Headers({
      "content-type": document.contentType,
      "content-length": String(bytes.byteLength),
      "content-disposition": `inline; filename="${document.fileName.replace(/"/g, "")}"`,
      "cache-control": "private, no-store",
      "x-request-id": requestId,
    });

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers,
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
