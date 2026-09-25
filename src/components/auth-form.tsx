"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload =
      mode === "register"
        ? {
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
            displayName: String(form.get("displayName") ?? ""),
            intent: String(form.get("intent") ?? "seller"),
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
    };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? body.error ?? "Request failed");
      return;
    }
    router.push(mode === "register" ? "/seller/onboarding" : "/account");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
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
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="rounded-lg border border-border bg-surface px-3 py-2"
        />
      </label>
      {mode === "register" ? (
        <label className="flex flex-col gap-1 text-sm">
          Account intent
          <select
            name="intent"
            defaultValue="seller"
            className="rounded-lg border border-border bg-surface px-3 py-2"
          >
            <option value="seller">Seller</option>
            <option value="customer">Customer</option>
          </select>
        </label>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-60"
      >
        {pending ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
