export type HealthData = {
  status: "ok";
  service: "aspera-marketplace";
  phase: "foundations";
  database: "not_configured";
};

export function buildHealthData(): HealthData {
  return {
    status: "ok",
    service: "aspera-marketplace",
    phase: "foundations",
    database: "not_configured",
  };
}
