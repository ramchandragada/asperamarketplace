/**
 * Pincode serviceability for Aspera Express.
 * Only configured pins are serviceable — currently Pune 411xxx.
 * Do not invent metro Express hubs without Aspera-operated capacity.
 */

export type PincodeCheckResult = {
  postalCode: string;
  serviceable: boolean;
  city: string | null;
  state: string | null;
  /** Human ETA, e.g. "60–90 mins". */
  etaLabel: string | null;
  /** Lower bound minutes when express; null when not serviceable. */
  etaMinutes: number | null;
  /** True when the pin is inside a configured Express zone. */
  express: boolean;
  codAvailable: boolean;
  message: string;
};

type PinMeta = {
  city: string;
  state: string;
  /** Express minutes (single value → banded label). */
  etaMinutes: number;
  express: boolean;
};

/** Explicit pin overrides inside the Pune Express circle. */
const PIN_DIRECTORY: Record<string, PinMeta> = {
  "411001": { city: "Pune", state: "Maharashtra", etaMinutes: 60, express: true },
  "411002": { city: "Pune", state: "Maharashtra", etaMinutes: 75, express: true },
  "411004": { city: "Pune", state: "Maharashtra", etaMinutes: 75, express: true },
  "411005": { city: "Pune", state: "Maharashtra", etaMinutes: 60, express: true },
  "411007": { city: "Pune", state: "Maharashtra", etaMinutes: 90, express: true },
  "411014": { city: "Pune", state: "Maharashtra", etaMinutes: 90, express: true },
  "411016": { city: "Pune", state: "Maharashtra", etaMinutes: 75, express: true },
  "411021": { city: "Pune", state: "Maharashtra", etaMinutes: 90, express: true },
  "411027": { city: "Pune", state: "Maharashtra", etaMinutes: 90, express: true },
  "411038": { city: "Pune", state: "Maharashtra", etaMinutes: 75, express: true },
  "411045": { city: "Pune", state: "Maharashtra", etaMinutes: 90, express: true },
  "411057": { city: "Pune", state: "Maharashtra", etaMinutes: 90, express: true },
};

function formatEtaMinutes(minutes: number): string {
  if (minutes <= 90) {
    const low = Math.max(30, minutes - 15);
    return `${low}–${minutes} mins`;
  }
  const hoursLow = Math.max(1, Math.floor((minutes - 60) / 60));
  const hoursHigh = Math.ceil(minutes / 60);
  return `Today, ${hoursLow}–${hoursHigh} hrs`;
}

function puneExpressMeta(postalCode: string): PinMeta | null {
  if (!postalCode.startsWith("411")) return null;
  return (
    PIN_DIRECTORY[postalCode] ?? {
      city: "Pune",
      state: "Maharashtra",
      etaMinutes: 75,
      express: true,
    }
  );
}

export function checkPincodeServiceability(raw: string): PincodeCheckResult {
  const postalCode = raw.replace(/\D/g, "").slice(0, 6);
  if (postalCode.length !== 6) {
    return {
      postalCode,
      serviceable: false,
      city: null,
      state: null,
      etaLabel: null,
      etaMinutes: null,
      express: false,
      codAvailable: false,
      message: "Enter a valid 6-digit pincode",
    };
  }

  const known = puneExpressMeta(postalCode);
  if (known) {
    const etaLabel = formatEtaMinutes(known.etaMinutes);
    return {
      postalCode,
      serviceable: true,
      city: known.city,
      state: known.state,
      etaLabel,
      etaMinutes: known.etaMinutes,
      express: known.express,
      // COD enabled so orders can complete while Razorpay goes live later.
      codAvailable: true,
      message: `Pune Express · usually ${etaLabel} when in stock · Fulfilled by seller · COD available`,
    };
  }

  return {
    postalCode,
    serviceable: false,
    city: null,
    state: null,
    etaLabel: null,
    etaMinutes: null,
    express: false,
    codAvailable: false,
    message:
      "Not serviceable yet — Aspera Express currently delivers to Pune 411xxx pins only",
  };
}

export function assertServiceablePostalCode(postalCode: string) {
  const result = checkPincodeServiceability(postalCode);
  if (!result.serviceable) {
    throw new PincodeNotServiceableError(result.message);
  }
  return result;
}

export class PincodeNotServiceableError extends Error {
  readonly code = "PINCODE_NOT_SERVICEABLE";
  constructor(message: string) {
    super(message);
    this.name = "PincodeNotServiceableError";
  }
}
