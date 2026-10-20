import { requireActor } from "@/modules/identity/service";
import { getInvoiceForActor } from "@/modules/orders/service";
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
  } catch (error) {
    return jsonError(requestId, error);
  }
}
