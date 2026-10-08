/**
 * Refund and restock quantities must never exceed the purchased line.
 * Callers pass the requested quantity; this clamps it to what was sold.
 */
export function cappedReturnQuantity(
  purchasedQuantity: number,
  requestedQuantity: number,
  alreadyReturnedQuantity = 0,
): number {
  if (purchasedQuantity <= 0 || requestedQuantity <= 0) return 0;
  const remaining = purchasedQuantity - Math.max(0, alreadyReturnedQuantity);
  if (remaining <= 0) return 0;
  return Math.min(requestedQuantity, remaining);
}

export function returnRefundPaise(input: {
  lineTotalPaise: number;
  purchasedQuantity: number;
  requestedQuantity: number;
  alreadyReturnedQuantity?: number;
}): number {
  const quantity = cappedReturnQuantity(
    input.purchasedQuantity,
    input.requestedQuantity,
    input.alreadyReturnedQuantity ?? 0,
  );
  if (quantity <= 0 || input.purchasedQuantity <= 0) return 0;
  const unit = Math.floor(input.lineTotalPaise / input.purchasedQuantity);
  return unit * quantity;
}
