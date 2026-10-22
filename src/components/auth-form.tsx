"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type AuthFormProps = {
  mode: "login" | "register";
  nextPath?: string | null;
};

export function AuthForm({ mode, nextPath }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [totpChallenge, setTotpChallenge] = useState<string | null>(null);

  // Where to send the user once signed in. An explicit ?next= wins; otherwise
  // admins land on the admin console and sellers on their workspace, so nobody
  // has to hunt for the right link from the shopper account page.
  async function resolveDestination(): Promise<string> {
    if (nextPath) return nextPath;
    try {
      const response = await fetch("/api/auth/me");
      const body = (await response.json()) as {
        data?: { roles?: { key: string; sellerId?: string | null }[] };
      };
      const roles = body.data?.roles ?? [];
      if (roles.some((role) => role.key === "admin")) return "/admin";
      if (roles.some((role) => role.key === "seller_owner" || role.sellerId)) {
        return "/seller";
      }
    } catch {
      // Fall back to the shopper account page if the lookup fails.
    }
    return "/account";
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const intent = String(form.get("intent") ?? "customer");

    if (totpChallenge) {
      const response = await fetch("/api/auth/totp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          challengeToken: totpChallenge,
          code: String(form.get("totp") ?? ""),
        }),
      });
      const body = (await response.json()) as {
        message?: string;
        error?: string;
      };
      setPending(false);
      if (!response.ok) {
        setError(body.message ?? body.error ?? "Invalid authenticator code");
        return;
      }
      router.push(await resolveDestination());
      router.refresh();
      return;
    }

    const payload =
      mode === "register"
        ? {
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
            displayName: String(form.get("displayName") ?? ""),
            intent,
          }
        : {
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          };

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as {
      message?: string;
      error?: string;
      data?: { requiresTotp?: boolean; challengeToken?: string };
    };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? body.error ?? "Request failed");
      return;
    }
    if (body.data?.requiresTotp && body.data.challengeToken) {
      setTotpChallenge(body.data.challengeToken);
      return;
    }
    const destination =
      mode === "register" && intent === "seller"
        ? "/seller/onboarding"
        : await resolveDestination();
    router.push(destination);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
      {totpChallenge ? (
        <label className="flex flex-col gap-1 text-sm">
          Authenticator code
          <input
            name="totp"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            minLength={6}
            maxLength={8}
            className="rounded-lg border border-border bg-surface px-3 py-2"
            placeholder="6-digit code"
          />
        </label>
      ) : (
        <>
          {mode === "register" ? (
            <label className="flex flex-col gap-1 text-sm">
              Display name
              <input
                name="displayName"
                required
                className="rounded-lg border border-border bg-surface px-3 py-2"
              />
            </label>
          ) : null}
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-lg border border-border bg-surface px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={12}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              className="rounded-lg border border-border bg-surface px-3 py-2"
            />
          </label>
          {mode === "register" ? (
            <label className="flex flex-col gap-1 text-sm">
              Account intent
              <select
                name="intent"
                defaultValue="customer"
                className="rounded-lg border border-border bg-surface px-3 py-2"
              >
                <option value="seller">Seller</option>
                <option value="customer">Customer</option>
              </select>
            </label>
          ) : null}
        </>
      )}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-60"
      >
        {pending
          ? "Working…"
          : totpChallenge
            ? "Verify code"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
      </button>
    </form>
  );
}
