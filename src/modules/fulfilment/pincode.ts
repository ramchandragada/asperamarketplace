/**
 * Quick-commerce pincode serviceability + city/state autofill.
 * Express hubs (Pune first, then metros) quote delivery in minutes / same-day
 * windows — minute-level Express speed for in-stock parts.
 */

export type PincodeCheckResult = {
  postalCode: string;
  serviceable: boolean;
  city: string | null;
  state: string | null;
  /** Human ETA, e.g. "60–90 mins" or "Today, 2–4 hrs". */
  etaLabel: string | null;
  /** Lower bound minutes when express; null for day-scale ETAs. */
  etaMinutes: number | null;
  /** True when the pin is inside an Aspera Express hub. */
  express: boolean;
  codAvailable: boolean;
  message: string;
};

type PinMeta = {
  city: string;
  state: string;
  /** Express minutes (single value → “under X mins”). */
  etaMinutes: number;
  express: boolean;
};

/** Primary express hubs — local inventory / dark-store style coverage. */
const PIN_DIRECTORY: Record<string, PinMeta> = {
  // Pune — flagship Aspera Express city
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
  // Other metros — same-day express windows
  "110001": { city: "New Delhi", state: "Delhi", etaMinutes: 180, express: true },
  "110016": { city: "New Delhi", state: "Delhi", etaMinutes: 180, express: true },
  "400001": { city: "Mumbai", state: "Maharashtra", etaMinutes: 150, express: true },
  "400050": { city: "Mumbai", state: "Maharashtra", etaMinutes: 150, express: true },
  "560001": { city: "Bengaluru", state: "Karnataka", etaMinutes: 180, express: true },
  "560034": { city: "Bengaluru", state: "Karnataka", etaMinutes: 180, express: true },
  "600001": { city: "Chennai", state: "Tamil Nadu", etaMinutes: 210, express: true },
  "700001": { city: "Kolkata", state: "West Bengal", etaMinutes: 210, express: true },
  "500001": { city: "Hyderabad", state: "Telangana", etaMinutes: 180, express: true },
  "380001": { city: "Ahmedabad", state: "Gujarat", etaMinutes: 240, express: true },
  "302001": { city: "Jaipur", state: "Rajasthan", etaMinutes: 240, express: true },
  "226001": { city: "Lucknow", state: "Uttar Pradesh", etaMinutes: 300, express: false },
  "800001": { city: "Patna", state: "Bihar", etaMinutes: 360, express: false },
};

/** Explicitly non-serviceable prefixes (remote / invalid ranges for MVP). */
const BLOCKED_PREFIXES = ["00", "99"];

function formatEtaMinutes(minutes: number): string {
  if (minutes <= 90) {
    const low = Math.max(30, minutes - 15);
    return `${low}–${minutes} mins`;
  }
  if (minutes <= 240) {
    const hoursLow = Math.max(1, Math.floor((minutes - 60) / 60));
    const hoursHigh = Math.ceil(minutes / 60);
    return `Today, ${hoursLow}–${hoursHigh} hrs`;
  }
  return "Today / tomorrow morning";
}

function prefixExpress(postalCode: string): PinMeta | null {
  // Whole Pune circle rides Aspera Express.
  if (postalCode.startsWith("411")) {
    return {
      city: "Pune",
      state: "Maharashtra",
      etaMinutes: 75,
      express: true,
    };
  }
  return null;
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

  if (BLOCKED_PREFIXES.some((prefix) => postalCode.startsWith(prefix))) {
    return {
      postalCode,
      serviceable: false,
      city: null,
      state: null,
      etaLabel: null,
      etaMinutes: null,
      express: false,
      codAvailable: false,
      message: "Sorry, we do not deliver to this pincode yet",
    };
  }

  // COD is deferred (A-28) — never advertise it until a real COD payment path exists.
  const known = PIN_DIRECTORY[postalCode] ?? prefixExpress(postalCode);
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
      codAvailable: false,
      message: known.express
        ? `Aspera Express hub · usually ${etaLabel} when in stock · Prepaid · 7-day returns`
        : `Usually ${etaLabel} · Prepaid · 7-day returns`,
    };
  }

  // Outside known hubs: serviceable, but do not invent a precise ETA.
  return {
    postalCode,
    serviceable: true,
    city: null,
    state: null,
    etaLabel: "Usually 1–3 days",
    etaMinutes: null,
    express: false,
    codAvailable: false,
    message:
      "Standard delivery available · ETA confirmed at checkout · Prepaid · 7-day returns",
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
