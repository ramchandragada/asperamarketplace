import { prisma } from "@/platform/db/prisma";

export type PlatformCommandInput = {
  correlationId: string;
  actorId?: string;
  reason: string;
  flagKey: string;
  flagDescription: string;
  enabled: boolean;
};

/**
 * Writes a feature flag, an audit row, and an outbox event in one transaction.
 * This is the platform pattern later slices must reuse for money and inventory.
 */
export async function enableFeatureFlagCommand(input: PlatformCommandInput) {
  return prisma.$transaction(async (tx) => {
    const flag = await tx.featureFlag.upsert({
      where: { key: input.flagKey },
      create: {
        key: input.flagKey,
        description: input.flagDescription,
        enabled: input.enabled,
      },
      update: {
        description: input.flagDescription,
        enabled: input.enabled,
      },
    });

    const audit = await tx.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.enabled ? "feature_flag.enabled" : "feature_flag.disabled",
        targetType: "feature_flag",
        targetId: flag.id,
        afterState: {
          key: flag.key,
          enabled: flag.enabled,
        },
        reason: input.reason,
        correlationId: input.correlationId,
      },
    });

    const outbox = await tx.outboxEvent.create({
      data: {
        eventType: input.enabled ? "FeatureFlagEnabled" : "FeatureFlagDisabled",
        aggregateType: "feature_flag",
        aggregateId: flag.id,
        payload: {
          key: flag.key,
          enabled: flag.enabled,
          correlationId: input.correlationId,
        },
      },
    });

    return { flag, audit, outbox };
  });
}
