import { requireActor } from "@/modules/identity/service";
import {
  getInvoiceForActor,
  getInvoiceHtmlForActor,
} from "@/modules/orders/service";
import { getRequestId, jsonError } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string; invoiceId: string }> },
) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const { orderId, invoiceId } = await context.params;
    const url = new URL(request.url);
    const format = url.searchParams.get("format")?.toLowerCase();

    if (format === "json") {
      const invoice = await getInvoiceForActor(actor, orderId, invoiceId);
      const payload = {
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        currencyCode: invoice.currencyCode,
        totalPaise: invoice.totalPaise,
        issuedAt: invoice.issuedAt,
        document: invoice.document,
      };
      return new Response(JSON.stringify(payload, null, 2), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "content-disposition": `attachment; filename="${invoice.invoiceNumber}.json"`,
          "x-request-id": requestId,
        },
      });
    }

    const { invoiceNumber, html } = await getInvoiceHtmlForActor(
      actor,
      orderId,
      invoiceId,
    );
    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-disposition": `inline; filename="${invoiceNumber}.html"`,
        "x-request-id": requestId,
      },
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
