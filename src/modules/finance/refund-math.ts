import { commissionPaise } from "@/modules/finance/helpers";

/**
 * Refund policy for Aspera: a refund returns the merchandise price plus the GST
 * the buyer paid on those items. Shipping is non-refundable. The GST portion is
 * allocated to a line in proportion to its share of the order's merchandise
 * subtotal, matching how tax was collected across the order.
 */

export type RefundBreakdown = {
  /** Total cash returned to the buyer (merchandise + GST). */
  totalPaise: number;
  /** Merchandise portion (excludes GST). Drives settlement netting + caps. */
  merchandisePaise: number;
  /** GST portion returned to the buyer. */
  gstPaise: number;
  /** Platform commission reversed on the refunded merchandise. */
  commissionPaise: number;
  /** Seller-payable reduction (merchandise minus reversed commission). */
  sellerDebitPaise: number;
};

/** GST attributable to a merchandise amount, proportional to the order subtotal. */
export function allocatedGstPaise(input: {
  merchandisePaise: number;
  orderSubtotalPaise: number;
  orderTaxPaise: number;
}): number {
  if (input.merchandisePaise <= 0) return 0;
  if (input.orderSubtotalPaise <= 0 || input.orderTaxPaise <= 0) return 0;
  const gst = Math.floor(
    (input.orderTaxPaise * input.merchandisePaise) / input.orderSubtotalPaise,
  );
  return Math.max(0, gst);
}

/**
 * Build a balanced refund breakdown for a given merchandise amount. The caller
 * is responsible for passing a merchandise amount already scaled to the refunded
 * quantity and capped to what remains refundable on the line.
 */
export function refundBreakdown(input: {
  merchandisePaise: number;
  orderSubtotalPaise: number;
  orderTaxPaise: number;
  commissionRateBps: number;
}): RefundBreakdown {
  const merchandise = Math.max(0, Math.floor(input.merchandisePaise));
  if (merchandise <= 0) {
    return {
      totalPaise: 0,
      merchandisePaise: 0,
      gstPaise: 0,
      commissionPaise: 0,
      sellerDebitPaise: 0,
    };
  }
  const gst = allocatedGstPaise({
    merchandisePaise: merchandise,
    orderSubtotalPaise: input.orderSubtotalPaise,
    orderTaxPaise: input.orderTaxPaise,
  });
  const commission = Math.min(
    merchandise,
    commissionPaise(merchandise, input.commissionRateBps),
  );
  return {
    totalPaise: merchandise + gst,
    merchandisePaise: merchandise,
    gstPaise: gst,
    commissionPaise: commission,
    sellerDebitPaise: merchandise - commission,
  };
}

/** Per-unit merchandise price for a line, floored to whole paise. */
export function unitMerchandisePaise(
  lineTotalPaise: number,
  purchasedQuantity: number,
): number {
  if (purchasedQuantity <= 0) return 0;
  return Math.floor(lineTotalPaise / purchasedQuantity);
}

/**
 * Clamp a desired merchandise refund to what is still refundable on the line,
 * given what has already been refunded against it (across returns, cancels, and
 * protection claims). This is the single guard that prevents a line from being
 * refunded more than it was paid, no matter which path triggers the refund.
 */
export function cappedMerchandisePaise(input: {
  desiredMerchandisePaise: number;
  lineMerchandisePaise: number;
  alreadyRefundedMerchandisePaise: number;
}): number {
  const remaining =
    input.lineMerchandisePaise - Math.max(0, input.alreadyRefundedMerchandisePaise);
  if (remaining <= 0) return 0;
  return Math.max(0, Math.min(input.desiredMerchandisePaise, remaining));
}
