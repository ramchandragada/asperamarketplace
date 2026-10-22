/**
 * Shared, buyer-facing labels for internal status enums. Dashboards should show
 * these instead of raw enum keys (e.g. "awaiting_payment") or provider slugs.
 * One source of truth so the orders list and order detail always agree.
 */

function humanize(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

const ORDER_STATUS: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  paid: "Order confirmed",
  payment_failed: "Payment failed",
  cancelled: "Cancelled",
  partially_cancelled: "Partly cancelled",
  fulfilled: "Delivered",
};

const PAYMENT_STATUS: Record<string, string> = {
  created: "Started",
  pending: "Processing",
  succeeded: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
};

const REFUND_STATUS: Record<string, string> = {
  pending: "Refund in progress",
  succeeded: "Refunded",
  failed: "Refund failed",
};

const FULFILMENT_STATUS: Record<string, string> = {
  pending: "Preparing",
  processing: "Preparing",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS[status] ?? humanize(status);
}

export function paymentStatusLabel(status: string): string {
  return PAYMENT_STATUS[status] ?? humanize(status);
}

export function refundStatusLabel(status: string): string {
  return REFUND_STATUS[status] ?? humanize(status);
}

export function fulfilmentStatusLabel(status: string): string {
  return FULFILMENT_STATUS[status] ?? humanize(status);
}

/** A friendly provider name instead of a slug like "mock". */
export function paymentProviderLabel(provider: string): string {
  if (provider === "mock") return "Online payment";
  return humanize(provider);
}
