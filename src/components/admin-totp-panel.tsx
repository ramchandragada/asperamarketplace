"use client";

import { type FormEvent, useState } from "react";

export function AdminTotpPanel({ enabled }: { enabled: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function startSetup() {
    setPending(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/auth/totp/setup", { method: "POST" });
    const body = (await response.json()) as {
      message?: string;
      error?: string;
      data?: { secret?: string; otpauthUrl?: string };
    };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? body.error ?? "Setup failed");
      return;
    }
    setSecret(body.data?.secret ?? null);
    setOtpauthUrl(body.data?.otpauthUrl ?? null);
    setMessage("Add this key in your authenticator app, then confirm with a code.");
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/totp/setup", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: String(form.get("code") ?? "") }),
    });
    const body = (await response.json()) as {
      message?: string;
      error?: string;
    };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? body.error ?? "Could not enable authenticator");
      return;
    }
    setMessage("Authenticator enabled. Future admin sign-ins will ask for a code.");
    setSecret(null);
    setOtpauthUrl(null);
    window.location.reload();
  }

  return (
    <section className="rounded-[var(--radius)] border border-border bg-surface p-4">
      <h2 className="text-lg font-semibold">Admin authenticator (2FA)</h2>
      <p className="mt-1 text-sm text-muted">
        {enabled
          ? "Authenticator is enabled for this admin account."
          : "Production admin access requires an authenticator app (TOTP)."}
      </p>
      {!enabled ? (
        <div className="mt-4 flex flex-col gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => void startSetup()}
            className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
          >
            {pending ? "Working…" : "Start setup"}
          </button>
          {secret ? (
            <div className="rounded-[var(--radius-sm)] border border-dashed border-border bg-background p-3 text-sm">
              <p className="font-medium">Manual key</p>
              <p className="mt-1 break-all font-mono text-xs">{secret}</p>
              {otpauthUrl ? (
                <p className="mt-2 break-all text-xs text-muted">{otpauthUrl}</p>
              ) : null}
              <form onSubmit={confirm} className="mt-3 flex flex-col gap-2">
                <label className="flex flex-col gap-1 text-sm">
                  Confirmation code
                  <input
                    name="code"
                    required
                    minLength={6}
                    maxLength={8}
                    inputMode="numeric"
                    className="rounded-lg border border-border bg-surface px-3 py-2"
                  />
                </label>
                <button
                  type="submit"
                  disabled={pending}
                  className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
                >
                  Enable authenticator
                </button>
              </form>
            </div>
          ) : null}
        </div>
      ) : null}
      {message ? <p className="mt-3 text-sm text-accent">{message}</p> : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}
