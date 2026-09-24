import { prisma } from "@/platform/db/prisma";

export type DatabaseStatus =
  | "not_configured"
  | "configured"
  | "unavailable";

export type HealthData = {
  status: "ok" | "degraded";
  service: "aspera-marketplace";
  phase: "foundations";
  database: DatabaseStatus;
};

export function buildHealthData(database: DatabaseStatus): HealthData {
  return {
    status: database === "unavailable" ? "degraded" : "ok",
    service: "aspera-marketplace",
    phase: "foundations",
    database,
  };
}

export async function checkDatabaseStatus(): Promise<DatabaseStatus> {
  if (!process.env.DATABASE_URL) {
    return "not_configured";
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return "configured";
  } catch {
    return "unavailable";
  }
}
