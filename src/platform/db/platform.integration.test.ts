import { afterAll, describe, expect, it } from "vitest";
import { enableFeatureFlagCommand } from "@/platform/feature-flags/commands";
import { prisma } from "@/platform/db/prisma";
import { checkDatabaseStatus } from "@/platform/health";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.runIf(hasDatabase)("platform database integration", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("connects to the non-production database", async () => {
    await expect(checkDatabaseStatus()).resolves.toBe("configured");
  });

  it("writes a feature flag, audit log, and outbox event together", async () => {
    const correlationId = crypto.randomUUID();
    const flagKey = `platform.smoke.${correlationId}`;

    const result = await enableFeatureFlagCommand({
      correlationId,
      actorId: "system:test",
      reason: "Phase 1 slice 2 integration smoke",
      flagKey,
      flagDescription: "Temporary smoke flag. Safe to delete.",
      enabled: true,
    });

    expect(result.flag.enabled).toBe(true);
    expect(result.audit.correlationId).toBe(correlationId);
    expect(result.outbox.eventType).toBe("FeatureFlagEnabled");
    expect(result.outbox.status).toBe("pending");

    const auditCount = await prisma.auditLog.count({
      where: { correlationId },
    });
    const outboxCount = await prisma.outboxEvent.count({
      where: { aggregateId: result.flag.id },
    });

    expect(auditCount).toBe(1);
    expect(outboxCount).toBe(1);

    await prisma.outboxEvent.deleteMany({ where: { aggregateId: result.flag.id } });
    await prisma.auditLog.deleteMany({ where: { correlationId } });
    await prisma.featureFlag.delete({ where: { key: flagKey } });
  });
});

describe.runIf(!hasDatabase)("platform database integration skipped", () => {
  it("skips when DATABASE_URL is absent", () => {
    expect(process.env.DATABASE_URL).toBeUndefined();
  });
});
