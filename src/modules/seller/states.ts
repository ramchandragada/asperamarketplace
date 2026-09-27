import { SellerStatus } from "@prisma/client";

const ALLOWED: Record<SellerStatus, SellerStatus[]> = {
  draft: ["submitted"],
  submitted: ["under_review", "rejected"],
  under_review: ["approved", "rejected"],
  approved: ["suspended"],
  rejected: ["draft"],
  suspended: ["under_review"],
};

export function canTransitionSellerStatus(
  from: SellerStatus,
  to: SellerStatus,
): boolean {
  return ALLOWED[from].includes(to);
}

export function assertSellerTransition(
  from: SellerStatus,
  to: SellerStatus,
): void {
  if (!canTransitionSellerStatus(from, to)) {
    throw new SellerTransitionError(
      `Seller status cannot move from ${from} to ${to}`,
    );
  }
}

export class SellerTransitionError extends Error {
  readonly code = "INVALID_TRANSITION";

  constructor(message: string) {
    super(message);
    this.name = "SellerTransitionError";
  }
}
