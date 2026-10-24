"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";

const STORAGE_KEY = "aspera.pincode";
const EVENT = "aspera-pincode";

type PincodeCheck = {
  postalCode: string;
  serviceable: boolean;
  city: string | null;
  state: string | null;
  etaLabel: string | null;
  codAvailable: boolean;
  message: string;
};

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

function snapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function PinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s-6-5.1-6-10a6 6 0 1112 0c0 4.9-6 10-6 10z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ChevronIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Header delivery-pincode anchor. Persists the shopper's pincode per-browser
 * and verifies serviceability through the real /api/pincode/check endpoint.
 */
export function PincodeAnchor({ className = "" }: { className?: string }) {
  const saved = useSyncExternalStore(subscribe, snapshot, () => "");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function apply(event: FormEvent) {
    event.preventDefault();
    const clean = input.replace(/\D/g, "").slice(0, 6);
    if (clean.length !== 6) {
      setOk(false);
      setNote("Enter a valid 6-digit pincode");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/pincode/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ postalCode: clean }),
      });
      const body = (await response.json()) as {
        data?: { check: PincodeCheck };
        message?: string;
      };
      const check = body.data?.check;
      if (!check) {
        setOk(false);
        setNote(body.message ?? "Could not check pincode");
        return;
      }
      setOk(check.serviceable);
      setNote(check.message);
      if (check.serviceable) {
        try {
          localStorage.setItem(STORAGE_KEY, clean);
          window.dispatchEvent(new Event(EVENT));
        } catch {
          /* storage unavailable — display still updates for this view */
        }
        window.setTimeout(() => setOpen(false), 800);
      }
    } catch {
      setOk(false);
      setNote("Could not check pincode. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          setInput(saved);
          setNote(null);
          setOk(null);
          setOpen((value) => !value);
        }}
        className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-left text-foreground transition hover:border-accent"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <PinIcon className="h-4 w-4 shrink-0 text-accent" />
        <span className="leading-tight">
          <span className="block text-[10px] text-muted">Deliver to Pune</span>
          <span className="block text-[12px] font-semibold">
            {saved ? saved : "Select pincode"}
          </span>
        </span>
        <ChevronIcon className="h-3 w-3 shrink-0 text-muted" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Set delivery pincode"
          className="absolute top-[calc(100%+0.4rem)] left-0 z-50 w-64 rounded-[var(--radius)] border border-border bg-surface p-4 shadow-[var(--shadow-mega)]"
        >
          <p className="text-sm font-semibold text-foreground">
            Delivery pincode
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Check component availability in your Pune neighbourhood.
          </p>
          <form onSubmit={apply} className="mt-3 flex gap-2">
            <input
              inputMode="numeric"
              maxLength={6}
              value={input}
              onChange={(event) => {
                setInput(event.target.value.replace(/\D/g, "").slice(0, 6));
                setOk(null);
                setNote(null);
              }}
              placeholder="e.g. 411004"
              aria-label="Pincode"
              className="min-h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={pending}
              className="shrink-0 rounded-[var(--radius-sm)] bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-60"
            >
              {pending ? "…" : "Apply"}
            </button>
          </form>
          {note ? (
            <p
              className={`mt-2 text-xs ${
                ok === false ? "text-danger" : "text-success"
              }`}
            >
              {note}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
