import { randomBytes } from "node:crypto";
import { prisma } from "@/platform/db/prisma";
import {
  actorIsAdmin,
  AuthorizationError,
  type Actor,
} from "@/modules/identity/policy";
import {
  commissionPaise,
  DEFAULT_COMMISSION_BPS,
  LEDGER_ACCOUNTS,
} from "@/modules/finance/helpers";
import {
  cappedMerchandisePaise,
  netMerchandisePaise,
  refundBreakdown,
  unitMerchandisePaise,
  type RefundBreakdown,
} from "@/modules/finance/refund-math";
import type {
  CreateReconciliationInput,
  CreateSettlementInput,
  ReleaseSettlementInput,
  ResolveReconciliationInput,
} from "@/modules/finance/schema";
import type { Prisma } from "@prisma/client";

export class FinanceValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "FinanceValidationError";
  }
}

export class FinanceConflictError extends Error {
  readonly code = "CONFLICT";
  constructor(message: string) {
    super(message);
    this.name = "FinanceConflictError";
  }
}

function requireAdmin(actor: Actor) {
  if (!actorIsAdmin(actor)) {
    throw new AuthorizationError("Administrator role required");
  }
}

function entryNumber(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function ensureChartOfAccounts() {
  for (const account of LEDGER_ACCOUNTS) {
    await prisma.ledgerAccount.upsert({
      where: { code: account.code },
      create: {
        code: account.code,
        name: account.name,
        accountType: account.accountType,
      },
      update: {
        name: account.name,
        accountType: account.accountType,
        active: true,
      },
    });
  }
  const existing = await prisma.commissionRule.findFirst({
    where: { sellerId: null, active: true },
  });
  if (!existing) {
    await prisma.commissionRule.create({
      data: {
        name: "Default platform commission",
        rateBps: DEFAULT_COMMISSION_BPS,
        sellerId: null,
        description: "Default 10% marketplace commission (mock finance).",
      },
    });
  }
}

async function accountByCode(code: string, tx: Prisma.TransactionClient = prisma) {
  const account = await tx.ledgerAccount.findUnique({ where: { code } });
  if (!account) {
    throw new FinanceValidationError(`Ledger account ${code} is missing`);
  }
  return account;
}

export async function resolveCommissionRateBps(sellerId: string) {
  const sellerRule = await prisma.commissionRule.findFirst({
    where: { sellerId, active: true },
  });
  if (sellerRule) {
    return sellerRule.rateBps;
  }
  const platform = await prisma.commissionRule.findFirst({
    where: { sellerId: null, active: true },
  });
  return platform?.rateBps ?? DEFAULT_COMMISSION_BPS;
}

type LedgerLineInput = {
  accountCode: string;
  debitPaise?: number;
  creditPaise?: number;
  sellerId?: string | null;
  orderId?: string | null;
};

async function postBalancedEntry(params: {
  memo: string;
  correlationId: string;
  orderId?: string | null;
  sellerId?: string | null;
  sourceEvent: string;
  lines: LedgerLineInput[];
  tx?: Prisma.TransactionClient;
}) {
  const run = async (tx: Prisma.TransactionClient) => {
    const resolved = [];
    let debit = 0;
    let credit = 0;
    for (const line of params.lines) {
      const debitPaise = line.debitPaise ?? 0;
      const creditPaise = line.creditPaise ?? 0;
      if (debitPaise < 0 || creditPaise < 0) {
        throw new FinanceValidationError("Ledger amounts must be non-negative");
      }
      if ((debitPaise === 0) === (creditPaise === 0)) {
        throw new FinanceValidationError(
          "Each journal line needs exactly one of debit or credit",
        );
      }
      debit += debitPaise;
      credit += creditPaise;
      const account = await accountByCode(line.accountCode, tx);
      resolved.push({
        accountId: account.id,
        debitPaise,
        creditPaise,
        sellerId: line.sellerId ?? null,
        orderId: line.orderId ?? null,
      });
    }
    if (debit !== credit) {
      throw new FinanceValidationError(
        `Unbalanced journal entry: debit ${debit} != credit ${credit}`,
      );
    }
    const entry = await tx.journalEntry.create({
      data: {
        entryNumber: entryNumber("JE"),
        status: "posted",
        memo: params.memo,
        correlationId: params.correlationId,
        orderId: params.orderId ?? null,
        sellerId: params.sellerId ?? null,
        sourceEvent: params.sourceEvent,
        postedAt: new Date(),
        lines: { create: resolved },
      },
      include: { lines: true },
    });
    await tx.auditLog.create({
      data: {
        actorId: null,
        action: "ledger.posted",
        targetType: "journal_entry",
        targetId: entry.id,
        afterState: {
          entryNumber: entry.entryNumber,
          sourceEvent: params.sourceEvent,
          debit,
          credit,
        },
        reason: params.memo,
        correlationId: params.correlationId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: "JournalPosted",
        aggregateType: "journal_entry",
        aggregateId: entry.id,
        payload: {
          entryNumber: entry.entryNumber,
          sourceEvent: params.sourceEvent,
          orderId: params.orderId,
        },
      },
    });
    return entry;
  };

  if (params.tx) {
    return run(params.tx);
  }
  return prisma.$transaction(run);
}

/** Post collection / payable / commission when an order becomes paid. */
export async function postOrderPaidLedger(
  orderId: string,
  correlationId: string,
  tx?: Prisma.TransactionClient,
) {
  await ensureChartOfAccounts();
  const order = await (tx ?? prisma).order.findUniqueOrThrow({
    where: { id: orderId },
    include: { groups: true },
  });

  const existing = await (tx ?? prisma).journalEntry.findFirst({
    where: { orderId, sourceEvent: "order.paid", status: "posted" },
  });
  if (existing) {
    return existing;
  }

  const lines: LedgerLineInput[] = [
    {
      accountCode: "1000",
      debitPaise: order.totalPaise,
      orderId: order.id,
    },
  ];

  for (const group of order.groups) {
    const rateBps = await resolveCommissionRateBps(group.sellerId);
    const commission = commissionPaise(group.lineTotalPaise, rateBps);
    const sellerNet = group.lineTotalPaise - commission;
    lines.push({
      accountCode: "2000",
      creditPaise: sellerNet,
      sellerId: group.sellerId,
      orderId: order.id,
    });
    if (commission > 0) {
      lines.push({
        accountCode: "4000",
        creditPaise: commission,
        sellerId: group.sellerId,
        orderId: order.id,
      });
    }
  }

  if (order.shippingPaise > 0) {
    lines.push({
      accountCode: "4100",
      creditPaise: order.shippingPaise,
      orderId: order.id,
    });
  }
  if (order.taxPaise > 0) {
    lines.push({
      accountCode: "2200",
      creditPaise: order.taxPaise,
      orderId: order.id,
    });
  }

  // Absorb discount / rounding into commission revenue so the entry balances.
  const credited = lines.reduce((sum, line) => sum + (line.creditPaise ?? 0), 0);
  const debited = lines.reduce((sum, line) => sum + (line.debitPaise ?? 0), 0);
  const gap = debited - credited;
  if (gap > 0) {
    lines.push({
      accountCode: "4000",
      creditPaise: gap,
      orderId: order.id,
    });
  } else if (gap < 0) {
    // Discount larger than expected: reduce seller payable via refund liability bridge
    lines.push({
      accountCode: "2100",
      debitPaise: -gap,
      orderId: order.id,
    });
  }

  return postBalancedEntry({
    memo: `Order ${order.orderNumber} paid`,
    correlationId,
    orderId: order.id,
    sourceEvent: "order.paid",
    lines,
    tx,
  });
}

/**
 * Sum of merchandise already refunded against an order line (across returns,
 * cancels, and protection claims). Used to cap further refunds on the line.
 */
export async function alreadyRefundedMerchandisePaise(
  orderLineId: string,
  tx: Prisma.TransactionClient = prisma,
): Promise<number> {
  const agg = await tx.refund.aggregate({
    where: { orderLineId, status: { in: ["succeeded", "pending"] } },
    _sum: { merchandisePaise: true },
  });
  return agg._sum.merchandisePaise ?? 0;
}

/**
 * Create a line-scoped refund (coupon-net, remaining-cap, ledger) or no-op when
 * nothing remains refundable. Every cancel / return / protection path should use
 * this so `orderLineId` is always stamped and double-refunds are impossible.
 */
export async function createCappedLineRefund(params: {
  tx: Prisma.TransactionClient;
  order: {
    id: string;
    orderNumber: string;
    subtotalPaise: number;
    taxPaise: number;
    discountPaise: number;
  };
  sellerId: string;
  line: { id: string; lineTotalPaise: number; quantity: number };
  /** Units being refunded; defaults to the full purchased quantity. */
  quantity?: number;
  reason: string;
  correlationId: string;
  commissionRateBps: number;
  returnRequestId?: string;
  providerReference?: string;
}): Promise<{ breakdown: RefundBreakdown; refundId: string } | null> {
  const quantity = Math.max(
    0,
    Math.min(params.line.quantity, params.quantity ?? params.line.quantity),
  );
  if (quantity <= 0) return null;

  const lineNet = netMerchandisePaise({
    grossMerchandisePaise: params.line.lineTotalPaise,
    orderSubtotalPaise: params.order.subtotalPaise,
    orderDiscountPaise: params.order.discountPaise,
  });
  const unitNet = unitMerchandisePaise(lineNet, params.line.quantity);
  const desiredMerchandise = unitNet * quantity;
  const alreadyRefunded = await alreadyRefundedMerchandisePaise(
    params.line.id,
    params.tx,
  );
  const merchandisePaise = cappedMerchandisePaise({
    desiredMerchandisePaise: desiredMerchandise,
    lineMerchandisePaise: lineNet,
    alreadyRefundedMerchandisePaise: alreadyRefunded,
  });
  const breakdown = refundBreakdown({
    merchandisePaise,
    orderSubtotalPaise: params.order.subtotalPaise,
    orderTaxPaise: params.order.taxPaise,
    orderDiscountPaise: params.order.discountPaise,
    commissionRateBps: params.commissionRateBps,
  });
  if (breakdown.totalPaise <= 0) return null;

  const refund = await params.tx.refund.create({
    data: {
      orderId: params.order.id,
      orderLineId: params.line.id,
      returnRequestId: params.returnRequestId,
      amountPaise: breakdown.totalPaise,
      merchandisePaise: breakdown.merchandisePaise,
      status: "succeeded",
      provider: "mock",
      providerReference:
        params.providerReference ??
        `mock_ref_${randomBytes(8).toString("hex")}`,
      reason: params.reason,
      completedAt: new Date(),
    },
  });
  await postRefundLedger({
    orderId: params.order.id,
    sellerId: params.sellerId,
    reason: params.reason,
    correlationId: params.correlationId,
    breakdown,
    tx: params.tx,
  });
  return { breakdown, refundId: refund.id };
}

/**
 * Post a refund to the double-entry ledger. Cash clearing is credited the full
 * amount returned to the buyer; seller payable, commission revenue, and GST
 * collected are each debited (reversed) by their portion. The breakdown is
 * balanced by construction (sellerDebit + commission + gst === total).
 */
export async function postRefundLedger(params: {
  orderId: string;
  sellerId?: string | null;
  reason: string;
  correlationId: string;
  breakdown: {
    totalPaise: number;
    gstPaise: number;
    commissionPaise: number;
    sellerDebitPaise: number;
  };
  tx?: Prisma.TransactionClient;
}) {
  await ensureChartOfAccounts();
  const { breakdown } = params;
  if (breakdown.totalPaise <= 0) {
    throw new FinanceValidationError("Refund amount must be positive");
  }

  const lines: LedgerLineInput[] = [
    {
      accountCode: "1000",
      creditPaise: breakdown.totalPaise,
      orderId: params.orderId,
    },
  ];
  if (breakdown.sellerDebitPaise > 0) {
    lines.push({
      accountCode: "2000",
      debitPaise: breakdown.sellerDebitPaise,
      orderId: params.orderId,
      sellerId: params.sellerId,
    });
  }
  if (breakdown.commissionPaise > 0) {
    lines.push({
      accountCode: "4000",
      debitPaise: breakdown.commissionPaise,
      orderId: params.orderId,
      sellerId: params.sellerId,
    });
  }
  if (breakdown.gstPaise > 0) {
    lines.push({
      accountCode: "2200",
      debitPaise: breakdown.gstPaise,
      orderId: params.orderId,
    });
  }

  return postBalancedEntry({
    memo: params.reason,
    correlationId: params.correlationId,
    orderId: params.orderId,
    sellerId: params.sellerId,
    sourceEvent: "refund.posted",
    lines,
    tx: params.tx,
  });
}

export async function listJournalEntries(actor: Actor, limit = 50) {
  requireAdmin(actor);
  return prisma.journalEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 200),
    include: {
      lines: { include: { account: true } },
    },
  });
}

export async function createSettlementBatch(
  actor: Actor,
  input: CreateSettlementInput,
  correlationId: string,
) {
  requireAdmin(actor);
  await ensureChartOfAccounts();
  const periodStart = new Date(input.periodStart);
  const periodEnd = new Date(input.periodEnd);
  if (!(periodStart < periodEnd)) {
    throw new FinanceValidationError("periodStart must be before periodEnd");
  }

  const groups = await prisma.orderFulfilmentGroup.findMany({
    where: {
      sellerId: input.sellerId,
      status: "delivered",
      deliveredAt: { gte: periodStart, lte: periodEnd },
      settlementLines: { none: {} },
    },
    include: { order: true, lines: { select: { id: true } } },
  });

  if (groups.length === 0) {
    throw new FinanceValidationError(
      "No unsettled delivered fulfilment groups in that period",
    );
  }

  // Net out merchandise already refunded against these groups' lines, so a
  // delivered-then-returned line is not settled (and paid out) at full value.
  const allLineIds = groups.flatMap((group) => group.lines.map((line) => line.id));
  const refundAgg = allLineIds.length
    ? await prisma.refund.groupBy({
        by: ["orderLineId"],
        where: {
          orderLineId: { in: allLineIds },
          status: { in: ["succeeded", "pending"] },
        },
        _sum: { merchandisePaise: true },
      })
    : [];
  const refundedByLine = new Map(
    refundAgg.map((row) => [row.orderLineId, row._sum.merchandisePaise ?? 0]),
  );

  const rateBps = await resolveCommissionRateBps(input.sellerId);
  let gross = 0;
  let commission = 0;
  const lineCreates = groups.map((group) => {
    const refundedMerchandise = group.lines.reduce(
      (sum, line) => sum + (refundedByLine.get(line.id) ?? 0),
      0,
    );
    const settleableGross = Math.max(
      0,
      group.lineTotalPaise - refundedMerchandise,
    );
    const commissionAmount = commissionPaise(settleableGross, rateBps);
    const net = settleableGross - commissionAmount;
    gross += settleableGross;
    commission += commissionAmount;
    return {
      orderId: group.orderId,
      fulfilmentGroupId: group.id,
      grossPaise: settleableGross,
      commissionPaise: commissionAmount,
      netPaise: net,
    };
  });

  const { computeMarketplaceTcs } = await import("@/modules/tax/gst");
  const preTcsNet = gross - commission;
  const tcs = computeMarketplaceTcs(preTcsNet);
  const netAfterTcs = preTcsNet - tcs;

  return prisma.$transaction(async (tx) => {
    const batch = await tx.settlementBatch.create({
      data: {
        batchNumber: entryNumber("STL"),
        sellerId: input.sellerId,
        status: "pending",
        periodStart,
        periodEnd,
        grossPaise: gross,
        commissionPaise: commission,
        tcsPaise: tcs,
        netPaise: netAfterTcs,
        lines: { create: lineCreates },
      },
      include: { lines: true },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "settlement.created",
        targetType: "settlement_batch",
        targetId: batch.id,
        afterState: {
          batchNumber: batch.batchNumber,
          netPaise: batch.netPaise,
          tcsPaise: batch.tcsPaise,
          lines: batch.lines.length,
        },
        reason: "Finance created settlement batch (GST settlement + TCS withhold)",
        correlationId,
      },
    });
    return batch;
  });
}

export async function releaseSettlementBatch(
  actor: Actor,
  input: ReleaseSettlementInput,
  correlationId: string,
) {
  requireAdmin(actor);
  const batch = await prisma.settlementBatch.findUniqueOrThrow({
    where: { id: input.batchId },
    include: { lines: true },
  });
  if (batch.status !== "pending" && batch.status !== "held") {
    throw new FinanceConflictError(`Cannot release settlement in ${batch.status}`);
  }

  const seller = await prisma.seller.findUniqueOrThrow({
    where: { id: batch.sellerId },
  });
  if (seller.status !== "approved") {
    throw new FinanceValidationError("Seller must be approved before payout");
  }

  const openRisk = await prisma.reconciliationException.count({
    where: {
      status: { in: ["open", "investigating"] },
      reference: { contains: batch.sellerId },
    },
  });
  if (openRisk > 0) {
    await prisma.settlementBatch.update({
      where: { id: batch.id },
      data: {
        status: "held",
        holdReason: "Open reconciliation exceptions for seller",
        version: { increment: 1 },
      },
    });
    throw new FinanceConflictError(
      "Settlement held due to open reconciliation exceptions",
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.settlementBatch.update({
      where: { id: batch.id, version: batch.version },
      data: {
        status: "released",
        holdReason: null,
        releasedAt: new Date(),
        paidAt: new Date(),
        version: { increment: 1 },
      },
      include: { lines: true },
    });

    const tcsPaise = batch.tcsPaise ?? 0;
    const payoutPaise = batch.netPaise;
    const payableClearPaise = payoutPaise + tcsPaise;
    const releaseLines =
      tcsPaise > 0
        ? [
            {
              accountCode: "2000",
              debitPaise: payableClearPaise,
              sellerId: batch.sellerId,
            },
            {
              accountCode: "1000",
              creditPaise: payoutPaise,
              sellerId: batch.sellerId,
            },
            {
              accountCode: "2300",
              creditPaise: tcsPaise,
              sellerId: batch.sellerId,
            },
          ]
        : [
            {
              accountCode: "2000",
              debitPaise: payoutPaise,
              sellerId: batch.sellerId,
            },
            {
              accountCode: "1000",
              creditPaise: payoutPaise,
              sellerId: batch.sellerId,
            },
          ];

    await postBalancedEntry({
      memo: `Settlement ${batch.batchNumber} released (mock payout${tcsPaise > 0 ? " + TCS" : ""})`,
      correlationId,
      sellerId: batch.sellerId,
      sourceEvent: "settlement.released",
      lines: releaseLines,
      tx,
    });

    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "settlement.released",
        targetType: "settlement_batch",
        targetId: batch.id,
        afterState: { status: "released", reason: input.reason },
        reason: input.reason,
        correlationId,
      },
    });
    // Mark as paid immediately in mock mode (no external payout provider).
    return tx.settlementBatch.update({
      where: { id: updated.id },
      data: { status: "paid" },
      include: { lines: true },
    });
  });
}

export async function listSettlements(actor: Actor, sellerId?: string) {
  requireAdmin(actor);
  return prisma.settlementBatch.findMany({
    where: sellerId ? { sellerId } : undefined,
    orderBy: { createdAt: "desc" },
    include: { lines: true },
    take: 100,
  });
}

export async function createReconciliationException(
  actor: Actor,
  input: CreateReconciliationInput,
  correlationId: string,
) {
  requireAdmin(actor);
  return prisma.$transaction(async (tx) => {
    const created = await tx.reconciliationException.create({
      data: {
        kind: input.kind,
        reference: input.reference,
        description: input.description,
        amountPaise: input.amountPaise,
        status: "open",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "reconciliation.opened",
        targetType: "reconciliation_exception",
        targetId: created.id,
        afterState: { kind: input.kind, reference: input.reference },
        reason: input.description,
        correlationId,
      },
    });
    return created;
  });
}

export async function resolveReconciliationException(
  actor: Actor,
  input: ResolveReconciliationInput,
  correlationId: string,
) {
  requireAdmin(actor);
  const existing = await prisma.reconciliationException.findUniqueOrThrow({
    where: { id: input.exceptionId },
  });
  if (existing.status === "resolved" || existing.status === "written_off") {
    throw new FinanceConflictError("Exception already closed");
  }
  return prisma.$transaction(async (tx) => {
    const updated = await tx.reconciliationException.update({
      where: { id: existing.id },
      data: {
        status: input.status,
        resolution: input.resolution,
        resolvedAt: new Date(),
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "reconciliation.resolved",
        targetType: "reconciliation_exception",
        targetId: existing.id,
        afterState: { status: input.status },
        reason: input.resolution,
        correlationId,
      },
    });
    return updated;
  });
}

export async function listReconciliationExceptions(actor: Actor) {
  requireAdmin(actor);
  return prisma.reconciliationException.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function exportSettlementsCsv(actor: Actor) {
  requireAdmin(actor);
  const batches = await prisma.settlementBatch.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  const header =
    "batchNumber,sellerId,status,grossPaise,commissionPaise,netPaise,periodStart,periodEnd,releasedAt";
  const rows = batches.map((batch) =>
    [
      batch.batchNumber,
      batch.sellerId,
      batch.status,
      batch.grossPaise,
      batch.commissionPaise,
      batch.netPaise,
      batch.periodStart.toISOString(),
      batch.periodEnd.toISOString(),
      batch.releasedAt?.toISOString() ?? "",
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

export async function financeSummary(actor: Actor) {
  requireAdmin(actor);
  await ensureChartOfAccounts();
  const [entries, settlements, exceptions, accounts] = await Promise.all([
    prisma.journalEntry.count({ where: { status: "posted" } }),
    prisma.settlementBatch.groupBy({
      by: ["status"],
      _sum: { netPaise: true },
      _count: true,
    }),
    prisma.reconciliationException.count({
      where: { status: { in: ["open", "investigating"] } },
    }),
    prisma.ledgerAccount.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
  ]);
  return { entries, settlements, openExceptions: exceptions, accounts };
}
