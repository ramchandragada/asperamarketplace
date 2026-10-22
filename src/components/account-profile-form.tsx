"use client";

import { FormEvent, useState } from "react";

export function AccountProfileForm({
  initialDisplayName,
  email,
}: {
  initialDisplayName: string;
  email: string;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName }),
    });
    const body = (await response.json()) as {
      message?: string;
      data?: { profile: { displayName: string } };
    };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? "Could not update profile");
      return;
    }
    if (body.data?.profile) {
      setDisplayName(body.data.profile.displayName);
    }
    setMessage(body.message ?? "Profile updated");
  }

  return (
    <div className="flex flex-col gap-4">
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-surface p-5"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Display name</span>
          <input
            className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            minLength={2}
            maxLength={120}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Email</span>
          <input
            className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-muted"
            value={email}
            readOnly
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
