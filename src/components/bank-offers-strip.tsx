/**
 * Quarantined merchandising module.
 * Bank/UPI/EMI offer tiles require a persisted Promotion model with eligibility.
 * Do not import into storefront routes until promotions are real.
 */
export function BankOffersStrip() {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[aspera] BankOffersStrip is quarantined — no live promotion records.",
    );
  }
  return null;
}
