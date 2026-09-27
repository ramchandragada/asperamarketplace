import { OrderStatus, PaymentAttemptStatus } from "@prisma/client";

const ORDER_ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  awaiting_payment: ["paid", "payment_failed", "cancelled"],
  paid: ["cancelled", "partially_cancelled", "fulfilled"],
  payment_failed: ["awaiting_payment", "cancelled"],
  cancelled: [],
  partially_cancelled: ["cancelled", "fulfilled"],
  fulfilled: [],
};

const PAYMENT_ALLOWED: Record<PaymentAttemptStatus, PaymentAttemptStatus[]> = {
  created: ["pending", "cancelled"],
  pending: ["succeeded", "failed", "cancelled"],
  succeeded: [],
  failed: [],
  cancelled: [],
};

export function assertOrderTransition(from: OrderStatus, to: OrderStatus) {
  if (!ORDER_ALLOWED[from].includes(to)) {
    throw new OrderTransitionError(
      `Order status cannot move from ${from} to ${to}`,
    );
  }
}

export function assertPaymentTransition(
  from: PaymentAttemptStatus,
  to: PaymentAttemptStatus,
) {
  if (!PAYMENT_ALLOWED[from].includes(to)) {
    throw new PaymentTransitionError(
      `Payment status cannot move from ${from} to ${to}`,
    );
  }
}

export class OrderTransitionError extends Error {
  readonly code = "INVALID_TRANSITION";
  constructor(message: string) {
    super(message);
    this.name = "OrderTransitionError";
  }
}

export class PaymentTransitionError extends Error {
  readonly code = "INVALID_TRANSITION";
  constructor(message: string) {
    super(message);
    this.name = "PaymentTransitionError";
  }
}
