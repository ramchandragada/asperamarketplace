import { FulfilmentGroupStatus } from "@prisma/client";

const ALLOWED: Record<FulfilmentGroupStatus, FulfilmentGroupStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function assertFulfilmentTransition(
  from: FulfilmentGroupStatus,
  to: FulfilmentGroupStatus,
) {
  if (!ALLOWED[from].includes(to)) {
    throw new FulfilmentTransitionError(
      `Fulfilment cannot move from ${from} to ${to}`,
    );
  }
}

export class FulfilmentTransitionError extends Error {
  readonly code = "INVALID_TRANSITION";
  constructor(message: string) {
    super(message);
    this.name = "FulfilmentTransitionError";
  }
}
