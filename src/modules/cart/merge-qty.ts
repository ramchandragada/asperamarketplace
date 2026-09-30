/** Merged cart quantity cannot exceed units that are still available to sell. */
export function clampMergedQuantity(
  existingQuantity: number,
  incomingQuantity: number,
  availableQuantity: number,
): number {
  const available = Math.max(0, availableQuantity);
  const combined = Math.max(0, existingQuantity) + Math.max(0, incomingQuantity);
  return Math.min(available, combined);
}
