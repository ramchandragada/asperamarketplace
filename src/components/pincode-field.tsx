"use client";

import { useRef, useState } from "react";

type PincodeCheck = {
  postalCode: string;
  serviceable: boolean;
  city: string | null;
  state: string | null;
  etaLabel: string | null;
  codAvailable: boolean;
  message: string;
};

type Props = {
  name?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
  onResolved?: (check: PincodeCheck) => void;
  /** When true, show Check button (PDP style). Address forms auto-check on 6 digits. */
  showCheckButton?: boolean;
  autofillCityState?: boolean;
};

export function PincodeField({
  name = "postalCode",
  defaultValue = "",
  required = true,
  className =
    "min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-base md:min-h-0 md:text-sm",
  onResolved,
  showCheckButton = false,
  autofillCityState = false,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [note, setNote] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const lastChecked = useRef<string>("");

  function applyAutofill(check: PincodeCheck) {
    if (!autofillCityState || !check.serviceable) return;
    const form = rootRef.current?.closest("form");
    if (!form) return;
    if (check.city) {
      const city = form.querySelector<HTMLInputElement>('input[name="city"]');
      if (city) city.value = check.city;
    }
    if (check.state) {
      const state = form.querySelector<HTMLInputElement>('input[name="state"]');
      if (state) state.value = check.state;
    }
  }

  async function runCheck(raw: string) {
    const clean = raw.replace(/\D/g, "").slice(0, 6);
    setValue(clean);
    if (clean.length !== 6) {
      setOk(false);
      setNote("Enter a valid 6-digit pincode");
      lastChecked.current = "";
      return null;
    }
    if (clean === lastChecked.current && note) {
      return null;
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
        lastChecked.current = "";
        return null;
      }
      lastChecked.current = clean;
      setOk(check.serviceable);
      setNote(check.message);
      applyAutofill(check);
      onResolved?.(check);
      return check;
    } finally {
      setPending(false);
    }
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <input
          name={name}
          value={value}
          onChange={(event) => {
            const next = event.target.value.replace(/\D/g, "").slice(0, 6);
            setValue(next);
            setOk(null);
            setNote(null);
            if (!showCheckButton && next.length === 6) {
              void runCheck(next);
            }
          }}
          onBlur={() => {
            if (!showCheckButton && value.replace(/\D/g, "").length === 6) {
              void runCheck(value);
            }
          }}
          inputMode="numeric"
          maxLength={6}
          required={required}
          pattern="\d{6}"
          placeholder="Enter pincode"
          aria-label="Pincode"
          className={className}
        />
        {showCheckButton ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => void runCheck(value)}
            className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60 md:min-h-0"
          >
            {pending ? "…" : "Check"}
          </button>
        ) : null}
      </div>
      {note ? (
        <p
          className={`text-sm ${
            ok === false ? "text-red-700" : "text-muted"
          }`}
        >
          {note}
        </p>
      ) : null}
    </div>
  );
}
