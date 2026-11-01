import { INDIA_STATE_CODES } from "@/modules/tax/gst";

/** Schema-aligned GSTIN shape (uppercase). */
export const GSTIN_PATTERN =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export type ParsedGstin = {
  gstin: string;
  stateCode: string;
  registeredState: string;
  pan: string;
};

export type GstinProfile = ParsedGstin & {
  legalName: string | null;
  tradeName: string | null;
  taxpayerType: string | null;
  status: string | null;
  city: string | null;
  source: "gstin" | "gstinapi" | "vedart" | "custom";
};

const CODE_TO_STATE: Record<string, string> = Object.fromEntries(
  Object.entries(INDIA_STATE_CODES).map(([name, code]) => [
    code,
    name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
  ]),
);

/** Title-case state name for a 2-digit GST state code, or null if unknown. */
export function stateNameForCode(code: string): string | null {
  return CODE_TO_STATE[code.trim()] ?? null;
}

export function normalizeGstin(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Derive PAN + registered state from a GSTIN. No network call —
 * digits 1–2 are the state code, chars 3–12 are the PAN.
 */
export function parseGstin(raw: string): ParsedGstin | null {
  const gstin = normalizeGstin(raw);
  if (!GSTIN_PATTERN.test(gstin)) return null;
  const stateCode = gstin.slice(0, 2);
  const registeredState = stateNameForCode(stateCode);
  if (!registeredState) return null;
  return {
    gstin,
    stateCode,
    registeredState,
    pan: gstin.slice(2, 12),
  };
}

type RemoteProfile = {
  legalName: string | null;
  tradeName: string | null;
  taxpayerType: string | null;
  status: string | null;
  city: string | null;
  registeredState: string | null;
  source: GstinProfile["source"];
};

function asOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function fetchGstinApi(
  gstin: string,
  apiKey: string,
): Promise<RemoteProfile | null> {
  const response = await fetch(`https://www.gstinapi.in/v1/gstin/${gstin}`, {
    headers: { "x-api-key": apiKey, accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const body = (await response.json()) as {
    success?: boolean;
    data?: Record<string, unknown>;
  };
  const data = body.data;
  if (!data) return null;
  const stateFromCode =
    typeof data.state_code === "string"
      ? stateNameForCode(data.state_code)
      : null;
  return {
    legalName: asOptionalString(data.legal_name),
    tradeName: asOptionalString(data.trade_name),
    taxpayerType: asOptionalString(data.taxpayer_type),
    status: asOptionalString(data.status),
    city: asOptionalString(data.city),
    registeredState: stateFromCode,
    source: "gstinapi",
  };
}

/**
 * Public GST search used by theGSTco's GST Search page.
 * Returns null when the subscription is inactive or the payload is empty.
 */
async function fetchVedart(gstin: string): Promise<RemoteProfile | null> {
  const url = `https://csv.vedartsolutionapps.com/app/search_by_gstin?gstin=${encodeURIComponent(gstin)}`;
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const body = (await response.json()) as {
    result?: {
      status_cd?: string;
      status_desc?: string;
      data?: Record<string, unknown>;
    };
  };
  const data = body.result?.data;
  if (!data || typeof data !== "object") return null;
  const addr = (data.pradr as { addr?: Record<string, unknown> } | undefined)
    ?.addr;
  return {
    legalName: asOptionalString(data.lgnm),
    tradeName: asOptionalString(data.tradeNam),
    taxpayerType: asOptionalString(data.dty),
    status: asOptionalString(data.sts),
    city: asOptionalString(addr?.dst) ?? asOptionalString(addr?.loc),
    registeredState: asOptionalString(addr?.stcd),
    source: "vedart",
  };
}

async function fetchCustomLookup(
  gstin: string,
  endpoint: string,
  apiKey?: string,
): Promise<RemoteProfile | null> {
  const url = endpoint.includes("{gstin}")
    ? endpoint.replaceAll("{gstin}", encodeURIComponent(gstin))
    : `${endpoint.replace(/\/$/, "")}/${encodeURIComponent(gstin)}`;
  const headers: Record<string, string> = { accept: "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const body = (await response.json()) as Record<string, unknown>;
  const data =
    (body.data as Record<string, unknown> | undefined) ??
    (body.result as { data?: Record<string, unknown> } | undefined)?.data ??
    body;
  return {
    legalName:
      asOptionalString(data.legalName) ??
      asOptionalString(data.legal_name) ??
      asOptionalString(data.lgnm),
    tradeName:
      asOptionalString(data.tradeName) ??
      asOptionalString(data.trade_name) ??
      asOptionalString(data.tradeNam),
    taxpayerType:
      asOptionalString(data.taxpayerType) ??
      asOptionalString(data.taxpayer_type) ??
      asOptionalString(data.dty),
    status: asOptionalString(data.status) ?? asOptionalString(data.sts),
    city: asOptionalString(data.city),
    registeredState:
      asOptionalString(data.registeredState) ??
      asOptionalString(data.state) ??
      (typeof data.state_code === "string"
        ? stateNameForCode(data.state_code)
        : null),
    source: "custom",
  };
}

/**
 * Resolve seller profile fields from a GSTIN.
 * Always fills state + PAN from the number itself; legal/trade name come from
 * an optional remote provider when configured / available.
 */
export async function lookupGstinProfile(
  raw: string,
  env: Record<string, string | undefined> = process.env,
): Promise<GstinProfile | null> {
  const parsed = parseGstin(raw);
  if (!parsed) return null;

  const base: GstinProfile = {
    ...parsed,
    legalName: null,
    tradeName: null,
    taxpayerType: null,
    status: null,
    city: null,
    source: "gstin",
  };

  // Unit tests / offline fixtures — still return state + PAN from the number.
  if (env.GSTIN_LOOKUP_DISABLE_REMOTE === "true") {
    return base;
  }

  const apiKey = env.GSTIN_LOOKUP_API_KEY?.trim() ?? "";
  const customUrl = env.GSTIN_LOOKUP_URL?.trim() ?? "";

  let remote: RemoteProfile | null = null;
  try {
    if (customUrl) {
      remote = await fetchCustomLookup(
        parsed.gstin,
        customUrl,
        apiKey || undefined,
      );
    } else if (apiKey) {
      remote = await fetchGstinApi(parsed.gstin, apiKey);
    }
    // Opt-in public GST search (theGSTco / Vedart). Off by default — their
    // free subscription is often expired and would only add latency.
    if (
      !remote?.legalName &&
      env.GSTIN_LOOKUP_ENABLE_PUBLIC === "true"
    ) {
      const vedart = await fetchVedart(parsed.gstin);
      if (vedart?.legalName) remote = vedart;
    }
  } catch {
    // Network / provider failures must not block state+PAN autofill.
    remote = remote ?? null;
  }

  if (!remote) return base;

  return {
    ...base,
    legalName: remote.legalName,
    tradeName: remote.tradeName,
    taxpayerType: remote.taxpayerType,
    status: remote.status,
    city: remote.city,
    registeredState: remote.registeredState ?? parsed.registeredState,
    source: remote.legalName ? remote.source : "gstin",
  };
}
