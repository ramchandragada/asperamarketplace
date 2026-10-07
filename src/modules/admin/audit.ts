import { prisma } from "@/platform/db/prisma";
import { requireAdmin, type Actor } from "@/modules/identity/policy";

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

export async function listAuditLogs(
  actor: Actor,
  options?: { take?: number; action?: string },
): Promise<AuditLogRow[]> {
  requireAdmin(actor);
  const take = Math.min(Math.max(options?.take ?? 100, 1), 200);
  const action = options?.action?.trim();

  const rows = await prisma.auditLog.findMany({
    where: action ? { action: { contains: action, mode: "insensitive" } } : undefined,
    orderBy: { createdAt: "desc" },
    take,
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
  });

  return rows.map((row) => ({
    id: row.id,
    actorId: row.actorId,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    reason: row.reason,
    correlationId: row.correlationId,
    createdAt: row.createdAt.toISOString(),
  }));
}
