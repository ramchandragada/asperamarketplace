export type TaxTrace = {
  policyKey: string;
  policyVersion: number;
  explanation: string;
  rateBps: number;
  taxablePaise: number;
  taxPaise: number;
};

export type CouponTrace = {
  code: string | null;
  accepted: boolean;
  reason: string;
  discountPaise: number;
};

export type ShippingTrace = {
  policyKey: string;
  explanation: string;
  weightGrams: number;
  destinationState: string;
  shippingPaise: number;
};

export type CheckoutLineSnapshot = {
  variantId: string;
  productId: string;
  sellerId: string;
  sellerName: string;
  productTitle: string;
  variantTitle: string;
  sku: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
  availableQty: number;
};

export type CheckoutSnapshot = {
  currencyCode: "INR";
  lines: CheckoutLineSnapshot[];
  groups: Array<{
    sellerId: string;
    sellerName: string;
    lineTotalPaise: number;
  }>;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  tax: TaxTrace;
  coupon: CouponTrace;
  shipping: ShippingTrace;
  calculatedAt: string;
};

/** Configurable stub — not a legal GST determination (A-24 remains open). */
export const TAX_POLICY = {
  key: "india_placeholder_gst_trace",
  version: 1,
  rateBps: 1800,
  explanation:
    "Placeholder 18% applied on taxable merchandise for development trace only. Not a production GST engine.",
} as const;

export const SHIPPING_POLICY = {
  key: "flat_domestic_estimate",
  basePaise: 4900,
  perKgPaise: 2000,
  freeAbovePaise: 99900,
  explanation:
    "Estimate only: flat domestic fee plus weight surcharge; free above ₹999 merchandise subtotal.",
} as const;

export const KNOWN_COUPONS: Record<
  string,
  { discountBps: number; maxDiscountPaise: number; explanation: string }
> = {
  ASPERA10: {
    discountBps: 1000,
    maxDiscountPaise: 20000,
    explanation: "Development coupon: 10% off merchandise, capped at ₹200.",
  },
};

export function availableQuantity(onHand: number, reserved: number): number {
  return Math.max(onHand - reserved, 0);
}

export function computeTax(taxablePaise: number): TaxTrace {
  const taxPaise = Math.floor((taxablePaise * TAX_POLICY.rateBps) / 10_000);
  return {
    policyKey: TAX_POLICY.key,
    policyVersion: TAX_POLICY.version,
    explanation: TAX_POLICY.explanation,
    rateBps: TAX_POLICY.rateBps,
    taxablePaise,
    taxPaise,
  };
}

export function computeCoupon(
  code: string | undefined,
  subtotalPaise: number,
): CouponTrace {
  if (!code) {
    return {
      code: null,
      accepted: false,
      reason: "No coupon supplied",
      discountPaise: 0,
    };
  }
  const normalized = code.trim().toUpperCase();
  const coupon = KNOWN_COUPONS[normalized];
  if (!coupon) {
    return {
      code: normalized,
      accepted: false,
      reason: "Unknown or inactive coupon code",
      discountPaise: 0,
    };
  }
  const raw = Math.floor((subtotalPaise * coupon.discountBps) / 10_000);
  const discountPaise = Math.min(raw, coupon.maxDiscountPaise, subtotalPaise);
  return {
    code: normalized,
    accepted: true,
    reason: coupon.explanation,
    discountPaise,
  };
}

export function computeShipping(input: {
  subtotalAfterDiscountPaise: number;
  weightGrams: number;
  destinationState: string;
}): ShippingTrace {
  if (input.subtotalAfterDiscountPaise >= SHIPPING_POLICY.freeAbovePaise) {
    return {
      policyKey: SHIPPING_POLICY.key,
      explanation: `${SHIPPING_POLICY.explanation} Free shipping threshold met.`,
      weightGrams: input.weightGrams,
      destinationState: input.destinationState,
      shippingPaise: 0,
    };
  }
  const kg = Math.max(1, Math.ceil(input.weightGrams / 1000));
  const shippingPaise =
    SHIPPING_POLICY.basePaise + (kg - 1) * SHIPPING_POLICY.perKgPaise;
  return {
    policyKey: SHIPPING_POLICY.key,
    explanation: SHIPPING_POLICY.explanation,
    weightGrams: input.weightGrams,
    destinationState: input.destinationState,
    shippingPaise,
  };
}

export function buildCheckoutSnapshot(input: {
  lines: Omit<CheckoutLineSnapshot, "lineTotalPaise">[];
  couponCode?: string;
  destinationState: string;
  totalWeightGrams: number;
}): CheckoutSnapshot {
  const lines: CheckoutLineSnapshot[] = input.lines.map((line) => ({
    ...line,
    lineTotalPaise: line.unitPricePaise * line.quantity,
  }));
  const subtotalPaise = lines.reduce((sum, line) => sum + line.lineTotalPaise, 0);
  const coupon = computeCoupon(input.couponCode, subtotalPaise);
  if (input.couponCode && !coupon.accepted) {
    throw new CouponRejectedError(coupon.reason);
  }
  const afterDiscount = subtotalPaise - coupon.discountPaise;
  const shipping = computeShipping({
    subtotalAfterDiscountPaise: afterDiscount,
    weightGrams: input.totalWeightGrams,
    destinationState: input.destinationState,
  });
  const tax = computeTax(afterDiscount);
  const totalPaise = afterDiscount + shipping.shippingPaise + tax.taxPaise;

  const groupMap = new Map<
    string,
    { sellerId: string; sellerName: string; lineTotalPaise: number }
  >();
  for (const line of lines) {
    const existing = groupMap.get(line.sellerId);
    if (existing) {
      existing.lineTotalPaise += line.lineTotalPaise;
    } else {
      groupMap.set(line.sellerId, {
        sellerId: line.sellerId,
        sellerName: line.sellerName,
        lineTotalPaise: line.lineTotalPaise,
      });
    }
  }

  return {
    currencyCode: "INR",
    lines,
    groups: [...groupMap.values()],
    subtotalPaise,
    discountPaise: coupon.discountPaise,
    shippingPaise: shipping.shippingPaise,
    taxPaise: tax.taxPaise,
    totalPaise,
    tax,
    coupon,
    shipping,
    calculatedAt: new Date().toISOString(),
  };
}

export class CouponRejectedError extends Error {
  readonly code = "COUPON_REJECTED";
  constructor(message: string) {
    super(message);
    this.name = "CouponRejectedError";
  }
}

export class TotalsMismatchError extends Error {
  readonly code = "TOTALS_MISMATCH";
  constructor(message: string) {
    super(message);
    this.name = "TotalsMismatchError";
  }
}
