import type { Prisma } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import type { CheckoutSnapshot } from "@/modules/cart/pricing";

type ReservationLine = { variantId: string; quantity: number };

let lastSweepAt = 0;
const SWEEP_INTERVAL_MS = 15_000;

export function reservationLinesFromSnapshot(
  snapshot: unknown,
): ReservationLine[] {
  if (!snapshot || typeof snapshot !== "object") return [];
  const lines = (snapshot as Partial<CheckoutSnapshot>).lines;
  if (!Array.isArray(lines)) return [];
  const parsed: ReservationLine[] = [];
  for (const line of lines) {
    if (!line || typeof line !== "object") continue;
    const variantId = (line as { variantId?: unknown }).variantId;
    const quantity = (line as { quantity?: unknown }).quantity;
    if (typeof variantId !== "string" || variantId.length === 0) continue;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity <= 0) {
      continue;
    }
    parsed.push({ variantId, quantity });
  }
  return parsed;
}

async function releaseClaimedSession(
  tx: Prisma.TransactionClient,
  sessionId: string,
  now: Date,
  correlationId: string,
) {
  const claimed = await tx.checkoutSession.updateMany({
    where: {
      id: sessionId,
      status: "reserved",
      reservedUntil: { lt: now },
    },
    data: { status: "expired" },
  });
  if (claimed.count !== 1) return false;

  const session = await tx.checkoutSession.findUnique({
    where: { id: sessionId },
    select: { id: true, snapshot: true, userId: true },
  });
  if (!session) return false;

  for (const line of reservationLinesFromSnapshot(session.snapshot)) {
    const inventory = await tx.inventoryItem.findUnique({
      where: { variantId: line.variantId },
    });
    if (!inventory || inventory.reserved <= 0) continue;
    const quantity = Math.min(inventory.reserved, line.quantity);
    await tx.inventoryItem.update({
      where: { id: inventory.id },
      data: {
        reserved: { decrement: quantity },
        version: { increment: 1 },
      },
    });
    await tx.stockMovement.create({
      data: {
        inventoryItemId: inventory.id,
        movementType: "release",
        quantity,
        reason: `Checkout ${session.id} reservation expired`,
        actorId: session.userId,
        correlationId,
      },
    });
  }
  return true;
}

/**
 * Return stock held by checkout sessions whose reservation window has passed.
 * A short throttle avoids repeating the sweep on every header render.
 * Pass force to release a specific shopper's holds immediately.
 */
export async function releaseExpiredCheckoutReservations(options?: {
  userId?: string;
  force?: boolean;
  now?: Date;
  correlationId?: string;
}): Promise<number> {
  const now = options?.now ?? new Date();
  const nowMs = now.getTime();
  if (
    !options?.force &&
    !options?.userId &&
    nowMs - lastSweepAt < SWEEP_INTERVAL_MS
  ) {
    return 0;
  }
  if (!options?.userId) {
    lastSweepAt = nowMs;
  }

  const expired = await prisma.checkoutSession.findMany({
    where: {
      status: "reserved",
      reservedUntil: { lt: now },
      ...(options?.userId ? { userId: options.userId } : {}),
    },
    select: { id: true },
    orderBy: { reservedUntil: "asc" },
    take: 100,
  });

  let released = 0;
  for (const session of expired) {
    const didRelease = await prisma.$transaction((tx) =>
      releaseClaimedSession(
        tx,
        session.id,
        now,
        options?.correlationId ?? "reservation-expiry",
      ),
    );
    if (didRelease) released += 1;
  }
  return released;
}
