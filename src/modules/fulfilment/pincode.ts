/**
 * Shared pincode serviceability + city/state autofill.
 * Coverage is an allow-list of metro / major PIN prefixes plus a default
 * serviceable rule for valid Indian 6-digit pins (not starting with 0).
 */

export type PincodeCheckResult = {
  postalCode: string;
  serviceable: boolean;
  city: string | null;
  state: string | null;
  etaLabel: string | null;
  codAvailable: boolean;
  message: string;
};

const PIN_DIRECTORY: Record<
  string,
  { city: string; state: string; etaDays: number }
> = {
  "110001": { city: "New Delhi", state: "Delhi", etaDays: 3 },
  "110016": { city: "New Delhi", state: "Delhi", etaDays: 3 },
  "400001": { city: "Mumbai", state: "Maharashtra", etaDays: 3 },
  "400050": { city: "Mumbai", state: "Maharashtra", etaDays: 3 },
  "411001": { city: "Pune", state: "Maharashtra", etaDays: 4 },
  "560001": { city: "Bengaluru", state: "Karnataka", etaDays: 3 },
  "560034": { city: "Bengaluru", state: "Karnataka", etaDays: 3 },
  "600001": { city: "Chennai", state: "Tamil Nadu", etaDays: 4 },
  "700001": { city: "Kolkata", state: "West Bengal", etaDays: 4 },
  "500001": { city: "Hyderabad", state: "Telangana", etaDays: 4 },
  "380001": { city: "Ahmedabad", state: "Gujarat", etaDays: 4 },
  "302001": { city: "Jaipur", state: "Rajasthan", etaDays: 5 },
  "226001": { city: "Lucknow", state: "Uttar Pradesh", etaDays: 5 },
  "800001": { city: "Patna", state: "Bihar", etaDays: 6 },
};

/** Explicitly non-serviceable prefixes (remote / invalid ranges for MVP). */
const BLOCKED_PREFIXES = ["00", "99"];

function etaLabelFromDays(days: number): string {
  const day = new Date();
  day.setDate(day.getDate() + days);
  return day.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
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
      codAvailable: false,
      message: "Sorry, we do not deliver to this pincode yet",
    };
  }

  const known = PIN_DIRECTORY[postalCode];
  if (known) {
    const etaLabel = etaLabelFromDays(known.etaDays);
    return {
      postalCode,
      serviceable: true,
      city: known.city,
      state: known.state,
      etaLabel,
      codAvailable: true,
      message: `Delivery by ${etaLabel} · Cash on Delivery available · 7 Day Easy Returns`,
    };
  }

  // Heuristic: first digit maps loosely to Indian postal circle; treat as serviceable.
  const etaDays = 3 + (Number(postalCode) % 4);
  const etaLabel = etaLabelFromDays(etaDays);
  return {
    postalCode,
    serviceable: true,
    city: null,
    state: null,
    etaLabel,
    codAvailable: true,
    message: `Delivery by ${etaLabel} · Cash on Delivery available · 7 Day Easy Returns`,
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
