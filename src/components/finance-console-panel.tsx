"use client";

import { FormEvent, useState } from "react";
import { formatPaise } from "@/modules/catalogue/helpers";

type Summary = {
  entries: number;
  openExceptions: number;
  accounts: Array<{ code: string; name: string; accountType: string }>;
  settlements: Array<{
    status: string;
    _count: number;
    _sum: { netPaise: number | null };
  }>;
};

type JournalEntry = {
  id: string;
  entryNumber: string;
  memo: string;
  sourceEvent: string;
  status: string;
  postedAt: string | null;
  lines: Array<{
    debitPaise: number;
    creditPaise: number;
    account: { code: string; name: string };
  }>;
};

type Settlement = {
  id: string;
  batchNumber: string;
  sellerId: string;
  status: string;
  grossPaise: number;
  commissionPaise: number;
  netPaise: number;
  periodStart: string;
  periodEnd: string;
};

type ExceptionRow = {
  id: string;
  kind: string;
  reference: string;
  description: string;
  status: string;
  amountPaise: number | null;
};

export function FinanceConsolePanel({
  initialSummary,
  initialEntries,
  initialSettlements,
  initialExceptions,
}: {
  initialSummary: Summary;
  initialEntries: JournalEntry[];
  initialSettlements: Settlement[];
  initialExceptions: ExceptionRow[];
}) {
  const [summary, setSummary] = useState(initialSummary);
  const [entries, setEntries] = useState(initialEntries);
  const [settlements, setSettlements] = useState(initialSettlements);
  const [exceptions, setExceptions] = useState(initialExceptions);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [summaryRes, journalRes, settleRes, reconRes] = await Promise.all([
      fetch("/api/finance/journal?summary=1"),
      fetch("/api/finance/journal"),
      fetch("/api/finance/settlements"),
      fetch("/api/finance/reconcile"),
    ]);
    const summaryBody = (await summaryRes.json()) as {
      data?: { summary: Summary };
    };
    const journalBody = (await journalRes.json()) as {
      data?: { entries: JournalEntry[] };
    };
    const settleBody = (await settleRes.json()) as {
      data?: { settlements: Settlement[] };
    };
    const reconBody = (await reconRes.json()) as {
      data?: { exceptions: ExceptionRow[] };
    };
    if (summaryRes.ok) setSummary(summaryBody.data?.summary ?? summary);
    if (journalRes.ok) setEntries(journalBody.data?.entries ?? []);
    if (settleRes.ok) setSettlements(settleBody.data?.settlements ?? []);
    if (reconRes.ok) setExceptions(reconBody.data?.exceptions ?? []);
  }

  async function createSettlement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/finance/settlements", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sellerId: String(form.get("sellerId") ?? ""),
        periodStart: new Date(String(form.get("periodStart") ?? "")).toISOString(),
        periodEnd: new Date(String(form.get("periodEnd") ?? "")).toISOString(),
      }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Could not create settlement");
      return;
    }
    setMessage(body.message ?? "Settlement created");
    await refresh();
  }

  async function releaseSettlement(batchId: string) {
    setError(null);
    setMessage(null);
    const response = await fetch("/api/finance/settlements/release", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ batchId }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Release failed");
      return;
    }
    setMessage(body.message ?? "Released");
    await refresh();
  }

  async function openException(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/finance/reconcile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: String(form.get("kind") ?? "manual"),
        reference: String(form.get("reference") ?? ""),
        description: String(form.get("description") ?? ""),
        amountPaise: form.get("amountPaise")
          ? Number(form.get("amountPaise"))
          : undefined,
      }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Could not open exception");
      return;
    }
    setMessage(body.message ?? "Exception opened");
    event.currentTarget.reset();
    await refresh();
  }

  async function resolveException(exceptionId: string) {
    const response = await fetch("/api/finance/reconcile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        exceptionId,
        resolution: "Mock finance resolved",
        status: "resolved",
      }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Resolve failed");
      return;
    }
    setMessage(body.message ?? "Resolved");
    await refresh();
  }

  return (
    <div className="flex flex-col gap-10">
      {message ? <p className="text-sm">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Summary</h2>
        <p className="text-sm text-muted">
          Posted journals: {summary.entries} · Open exceptions:{" "}
          {summary.openExceptions}
        </p>
        <ul className="text-sm">
          {summary.settlements.map((row) => (
            <li key={row.status}>
              {row.status}: {row._count} batches · net{" "}
              {formatPaise(row._sum.netPaise ?? 0)}
            </li>
          ))}
        </ul>
        <p className="text-sm">
          <a href="/api/finance/export" className="underline">
            Export settlements CSV
          </a>
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Create settlement batch</h2>
        <form onSubmit={createSettlement} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Seller id
            <input
              name="sellerId"
              required
              className="border border-black/20 bg-transparent px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Period start
            <input
              name="periodStart"
              type="datetime-local"
              required
              className="border border-black/20 bg-transparent px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Period end
            <input
              name="periodEnd"
              type="datetime-local"
              required
              className="border border-black/20 bg-transparent px-3 py-2"
            />
          </label>
          <button type="submit" className="w-fit underline">
            Create batch
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Settlements</h2>
        {settlements.length === 0 ? (
          <p className="text-sm text-muted">No settlement batches.</p>
        ) : (
          settlements.map((batch) => (
            <article
              key={batch.id}
              className="flex flex-col gap-1 border-t border-black/10 pt-3 text-sm"
            >
              <p className="font-medium">
                {batch.batchNumber} · {batch.status}
              </p>
              <p className="text-muted">
                Gross {formatPaise(batch.grossPaise)} · Commission{" "}
                {formatPaise(batch.commissionPaise)} · Net{" "}
                {formatPaise(batch.netPaise)}
              </p>
              {batch.status === "pending" || batch.status === "held" ? (
                <button
                  type="button"
                  className="w-fit underline"
                  onClick={() => void releaseSettlement(batch.id)}
                >
                  Release mock payout
                </button>
              ) : null}
            </article>
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Reconciliation</h2>
        <form onSubmit={openException} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Kind
            <select
              name="kind"
              className="border border-black/20 bg-transparent px-3 py-2"
              defaultValue="manual"
            >
              <option value="manual">manual</option>
              <option value="payment_mismatch">payment_mismatch</option>
              <option value="ledger_imbalance">ledger_imbalance</option>
              <option value="settlement_hold">settlement_hold</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Reference
            <input
              name="reference"
              required
              className="border border-black/20 bg-transparent px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Description
            <textarea
              name="description"
              required
              minLength={5}
              rows={2}
              className="border border-black/20 bg-transparent px-3 py-2"
            />
          </label>
          <button type="submit" className="w-fit underline">
            Open exception
          </button>
        </form>
        <ul className="flex flex-col gap-2 text-sm">
          {exceptions.map((row) => (
            <li key={row.id} className="border-t border-black/10 pt-2">
              {row.kind} · {row.status} · {row.reference}
              {row.status === "open" || row.status === "investigating" ? (
                <>
                  {" · "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => void resolveException(row.id)}
                  >
                    Resolve
                  </button>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Recent journal entries</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-muted">
            Journals post automatically when mock payments succeed.
          </p>
        ) : (
          entries.slice(0, 20).map((entry) => (
            <article
              key={entry.id}
              className="border-t border-black/10 pt-3 text-sm"
            >
              <p className="font-medium">
                {entry.entryNumber} · {entry.sourceEvent}
              </p>
              <p className="text-muted">{entry.memo}</p>
              <ul className="mt-1 text-xs text-muted">
                {entry.lines.map((line, index) => (
                  <li key={`${entry.id}-${index}`}>
                    {line.account.code} {line.account.name}: Dr{" "}
                    {line.debitPaise} / Cr {line.creditPaise}
                  </li>
                ))}
              </ul>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
