import { describe, expect, it } from "vitest";
import { buildHealthData } from "@/platform/health";

describe("buildHealthData", () => {
  it("marks the service ok when the database is configured", () => {
    expect(buildHealthData("configured")).toEqual({
      status: "ok",
      service: "aspera-marketplace",
      phase: "hardening",
      database: "configured",
      migrationsHint: "run pnpm db:migrate on non-prod only",
    });
  });

  it("marks the service degraded when the database is unavailable", () => {
    expect(buildHealthData("unavailable").status).toBe("degraded");
  });
});
