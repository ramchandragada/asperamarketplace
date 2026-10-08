import { prisma } from "@/platform/db/prisma";
import { requireAdmin, type Actor } from "@/modules/identity/policy";

/** Privileged / ops-facing actions shown in the admin audit filter dropdown. */
export const PRIVILEGED_AUDIT_ACTIONS = [
  "seller.draft_created",
  "seller.document_uploaded",
  "seller.submitted",
  "seller.approved",
  "seller.rejected",
  "seller.request_info",
  "seller.suspended",
  "seller.reactivated",
  "product.draft_created",
  "product.offer_draft_created",
  "product.submitted",
  "product.seller_updated",
  "product.seller_content_updated",
  "product.approved",
  "product.rejected",
  "order.created",
  "order.status_synced",
  "payment.started",
  "payment.succeeded",
  "payment.failed",
  "user.profile_updated",
  "address.created",
  "address.updated",
  "checkout.reserved",
  "fulfilment.processing",
  "fulfilment.shipped",
  "fulfilment.delivered",
  "fulfilment.cancelled",
  "return.requested",
  "ticket.created",
  "dispute.opened",
  "ledger.posted",
  "settlement.created",
  "settlement.released",
  "reconciliation.opened",
  "reconciliation.resolved",
  "risk.opened",
  "risk.updated",
  "counterfeit.reported",
  "counterfeit.reviewed",
  "review.created",
  "review.moderated",
  "privacy.requested",
  "privacy.updated",
  "compliance.evidence_created",
  "compliance.evidence_updated",
  "experiment.created",
  "experiment.updated",
  "feature_flag.enabled",
  "feature_flag.disabled",
  "user.registered",
  "address.created",
] as const;

export type AuditLogRow = {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  reason: string | null;
  correlationId: string;
  createdAt: string;
};

export type ListAuditLogsResult = {
  items: AuditLogRow[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  actions: string[];
};

export type ListAuditLogsOptions = {
  page?: number;
  pageSize?: number;
  action?: string;
  actorId?: string;
  from?: string | Date;
  to?: string | Date;
};

function excludeCartActionsWhere() {
  return { NOT: { action: { startsWith: "cart." } } };
}

function parseDateBound(value: string | Date | undefined, endOfDay: boolean) {
  if (value == null || value === "") return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (endOfDay) {
      date.setUTCHours(23, 59, 59, 999);
    } else {
      date.setUTCHours(0, 0, 0, 0);
    }
  }
  return date;
}

export async function listAuditLogs(
  actor: Actor,
  options?: ListAuditLogsOptions,
): Promise<ListAuditLogsResult> {
  requireAdmin(actor);

  const page = Math.max(1, Math.floor(options?.page ?? 1) || 1);
  const pageSize = Math.min(
    Math.max(Math.floor(options?.pageSize ?? 25) || 25, 1),
    100,
  );
  const action = options?.action?.trim() || undefined;
  const actorId = options?.actorId?.trim() || undefined;
  const from = parseDateBound(options?.from, false);
  const to = parseDateBound(options?.to, true);

  const where = {
    ...(action ? { action } : excludeCartActionsWhere()),
    ...(actorId ? { actorId } : {}),
    ...((from || to) && {
      createdAt: {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      },
    }),
  };

  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        actorId: true,
        action: true,
        targetType: true,
        targetId: true,
        reason: true,
        correlationId: true,
        createdAt: true,
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return {
    items: rows.map((row) => ({
      id: row.id,
      actorId: row.actorId,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      reason: row.reason,
      correlationId: row.correlationId,
      createdAt: row.createdAt.toISOString(),
    })),
    page,
    pageSize,
    total,
    pageCount,
    actions: [...PRIVILEGED_AUDIT_ACTIONS],
  };
}
