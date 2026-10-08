"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OrderPayButtons({
  orderId,
  canPay,
}: {
  orderId: string;
  canPay: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!canPay) return null;

  async function pay(outcome: "succeeded" | "failed") {
    setPending(true);
    setError(null);
    setMessage(null);
    const start = await fetch("/api/payments/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderId,
        idempotencyKey: `pay-${crypto.randomUUID()}`,
      }),
    });
    const startBody = (await start.json()) as {
      data?: { payment: { id: string } };
      message?: string;
    };
    if (!start.ok || !startBody.data) {
      setPending(false);
      setError(startBody.message ?? "Could not start payment");
      return;
    }
    const complete = await fetch("/api/payments/mock-complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        paymentAttemptId: startBody.data.payment.id,
        outcome,
        failureReason:
          outcome === "failed"
            ? "Mock decline for failure-path testing"
            : undefined,
      }),
    });
    const completeBody = (await complete.json()) as { message?: string };
    setPending(false);
    if (!complete.ok) {
      setError(completeBody.message ?? "Mock payment failed");
      return;
    }
    setMessage(
      outcome === "succeeded"
        ? "Payment successful"
        : (completeBody.message ?? "Payment failed"),
    );
    router.refresh();
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          className="min-h-11 rounded-full bg-brand-accent px-5 py-2 font-semibold text-white disabled:opacity-60"
          onClick={() => void pay("succeeded")}
        >
          {pending ? "Paying…" : "Pay with mock"}
        </button>
        <button
          type="button"
          disabled={pending}
          className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-60"
          onClick={() => void pay("failed")}
        >
          Simulate failure
        </button>
      </div>
      <p className="text-xs text-muted">
        Development mock payment only — no live card charges.
      </p>
    </div>
  );
}
