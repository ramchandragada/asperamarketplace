"use client";

import { FormEvent, useState } from "react";

type PrivacyRow = {
  id: string;
  requestType: string;
  status: string;
  details: string;
};

export function PrivacyRequestPanel({
  initialRequests,
}: {
  initialRequests: PrivacyRow[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const response = await fetch("/api/trust/privacy");
    const body = (await response.json()) as {
      data?: { requests: PrivacyRow[] };
    };
    if (response.ok) setRequests(body.data?.requests ?? []);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/trust/privacy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requestType: String(form.get("requestType") ?? "access"),
        details: String(form.get("details") ?? ""),
      }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Request failed");
      return;
    }
    setMessage(body.message ?? "Submitted");
    event.currentTarget.reset();
    await refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {message ? <p className="text-sm">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Request type
          <select
            name="requestType"
            defaultValue="access"
            className="border border-black/20 bg-transparent px-3 py-2"
          >
            <option value="access">access</option>
            <option value="erasure">erasure</option>
            <option value="correction">correction</option>
            <option value="portability">portability</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Details
          <textarea
            name="details"
            required
            minLength={10}
            rows={4}
            className="border border-black/20 bg-transparent px-3 py-2"
          />
        </label>
        <button type="submit" className="w-fit underline">
          Submit privacy request
        </button>
      </form>
      <ul className="flex flex-col gap-2 text-sm">
        {requests.map((row) => (
          <li key={row.id} className="border-t border-black/10 pt-2">
            {row.requestType} · {row.status}
            <p className="text-muted">{row.details}</p>
          </li>
        ))}
        {requests.length === 0 ? (
          <li className="text-muted">No privacy requests yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
