"use client";

import { FormEvent, useEffect, useState } from "react";

const STORAGE_KEY = "aspera.deliveryLocation";

export type SavedDeliveryLocation = {
  postalCode: string;
  city: string | null;
  state: string | null;
  etaLabel: string;
  express: boolean;
  etaMinutes: number | null;
};

type CheckPayload = {
  data?: {
    check?: SavedDeliveryLocation & {
      serviceable: boolean;
      message: string;
    };
  };
  message?: string;
};

function readSaved(): SavedDeliveryLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedDeliveryLocation;
    if (!parsed?.postalCode || !parsed?.etaLabel) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSaved(value: SavedDeliveryLocation | null) {
  if (typeof window === "undefined") return;
  if (!value) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("aspera:delivery-location", { detail: value }));
}

export function useDeliveryLocation() {
  const [location, setLocation] = useState<SavedDeliveryLocation | null>(null);

  useEffect(() => {
    setLocation(readSaved());
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) setLocation(readSaved());
    }
    function onCustom(event: Event) {
      const detail = (event as CustomEvent<SavedDeliveryLocation>).detail;
      setLocation(detail ?? readSaved());
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("aspera:delivery-location", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("aspera:delivery-location", onCustom);
    };
  }, []);

  return location;
}

/**
 * Blinkit-style location + ETA control for the header.
 * Compact: shows promise + area; expands to a pincode form on click.
 */
export function DeliveryLocationBar({
  compact = false,
}: {
  compact?: boolean;
}) {
  const saved = useDeliveryLocation();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (saved?.postalCode) setPin(saved.postalCode);
  }, [saved?.postalCode]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/pincode/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ postalCode: pin }),
      });
      const body = (await response.json()) as CheckPayload;
      const check = body.data?.check;
      if (!response.ok || !check) {
        setError(body.message ?? "Could not check pincode");
        return;
      }
      if (!check.serviceable) {
        setError(check.message || "Not serviceable yet");
        writeSaved(null);
        return;
      }
      writeSaved({
        postalCode: check.postalCode,
        city: check.city,
        state: check.state,
        etaLabel: check.etaLabel,
        express: check.express,
        etaMinutes: check.etaMinutes,
      });
      setOpen(false);
    } catch {
      setError("Network error — try again");
    } finally {
      setPending(false);
    }
  }

  const area =
    saved?.city ||
    (saved?.postalCode ? `PIN ${saved.postalCode}` : "Select location");
  const eta = saved?.etaLabel ?? "Set pincode";

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex min-h-11 min-w-0 flex-col items-start justify-center rounded-lg px-2 text-left transition hover:bg-background ${
          compact ? "md:min-h-9" : ""
        }`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span
          className={`font-display font-bold tracking-tight text-foreground ${
            compact ? "text-[13px] md:text-[14px]" : "text-[14px] md:text-[16px]"
          }`}
        >
          {saved?.express ? (
            <>
              <span className="text-accent">Express</span>
              <span className="text-muted"> · </span>
              <span>{eta}</span>
            </>
          ) : (
            eta
          )}
        </span>
        <span className="flex max-w-[11rem] items-center gap-1 truncate text-[11px] text-muted md:max-w-[14rem] md:text-[12px]">
          <span className="truncate">{area}</span>
          <span aria-hidden className="text-[9px]">
            ▼
          </span>
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Set delivery location"
          className="absolute top-[calc(100%+0.35rem)] left-0 z-50 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-3 shadow-[var(--shadow-card)]"
        >
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Delivery to
          </p>
          <form className="mt-2 flex gap-2" onSubmit={onSubmit}>
            <input
              value={pin}
              onChange={(event) =>
                setPin(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="6-digit pincode"
              className="h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
              aria-label="Pincode"
            />
            <button
              type="submit"
              disabled={pending || pin.length !== 6}
              className="btn-cta btn-cta-primary shrink-0 px-3"
            >
              {pending ? "…" : "Check"}
            </button>
          </form>
          {error ? (
            <p className="mt-2 text-xs text-danger">{error}</p>
          ) : (
            <p className="mt-2 text-xs text-muted">
              Pune Express hubs deliver in under 90 minutes for in-stock parts.
            </p>
          )}
          <button
            type="button"
            className="mt-2 text-xs font-medium text-accent hover:underline"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
