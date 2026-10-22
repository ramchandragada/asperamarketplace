"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DataQualityCleanupButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runCleanup() {
    if (
      !window.confirm(
        "Archive all duplicate and placeholder-only products flagged here? Archived listings are removed from the storefront. This is a bulk action.",
      )
    ) {
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/admin/data-quality/cleanup", {
      method: "POST",
    });
    const body = (await response.json()) as {
      message?: string;
      error?: string;
      data?: { archivedCount?: number };
    };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? body.error ?? "Cleanup failed");
      return;
    }
    setMessage(
      body.message ??
        `Archived ${body.data?.archivedCount ?? 0} issue product(s)`,
    );
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => void runCleanup()}
        className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
      >
        {pending ? "Cleaning…" : "Archive duplicates & placeholder-only"}
      </button>
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
