"use client";

import { FormEvent, useState } from "react";

type Ticket = {
  id: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  orderId: string | null;
  createdAt: string;
};

export function SupportCarePanel({
  initialTickets,
  defaultOrderId,
  defaultSellerId,
}: {
  initialTickets: Ticket[];
  defaultOrderId?: string;
  defaultSellerId?: string;
}) {
  const [tickets, setTickets] = useState(initialTickets);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshTickets() {
    const response = await fetch("/api/tickets");
    const body = (await response.json()) as { data?: { tickets: Ticket[] } };
    if (response.ok) {
      setTickets(body.data?.tickets ?? []);
    }
  }

  async function createTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const orderId = String(form.get("orderId") ?? "").trim();
    const payload = {
      subject: String(form.get("subject") ?? ""),
      body: String(form.get("body") ?? ""),
      priority: String(form.get("priority") ?? "normal"),
      orderId: orderId || undefined,
    };
    const response = await fetch("/api/tickets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Could not open ticket");
      return;
    }
    setMessage(body.message ?? "Ticket opened");
    event.currentTarget.reset();
    await refreshTickets();
  }

  async function createReturn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      orderId: String(form.get("orderId") ?? ""),
      sellerId: String(form.get("sellerId") ?? ""),
      quantity: Number(form.get("quantity") ?? 1),
      reason: String(form.get("reason") ?? ""),
    };
    const response = await fetch("/api/returns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Could not create return");
      return;
    }
    setMessage(body.message ?? "Return requested");
    event.currentTarget.reset();
  }

  async function createDispute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      orderId: String(form.get("orderId") ?? ""),
      sellerId: String(form.get("sellerId") ?? ""),
      reason: String(form.get("reason") ?? ""),
    };
    const response = await fetch("/api/disputes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Could not open dispute");
      return;
    }
    setMessage(body.message ?? "Dispute opened");
    event.currentTarget.reset();
  }

  return (
    <div className="flex flex-col gap-10">
      {message ? <p className="text-sm">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Open a support ticket</h2>
        <form onSubmit={createTicket} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Subject
            <input
              name="subject"
              required
              minLength={5}
              className="border border-black/20 bg-transparent px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Details
            <textarea
              name="body"
              required
              minLength={10}
              rows={4}
              className="border border-black/20 bg-transparent px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Order id (optional)
            <input
              name="orderId"
              defaultValue={defaultOrderId}
              className="border border-black/20 bg-transparent px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Priority
            <select
              name="priority"
              defaultValue="normal"
              className="border border-black/20 bg-transparent px-3 py-2"
            >
              <option value="low">low</option>
              <option value="normal">normal</option>
              <option value="high">high</option>
            </select>
          </label>
          <button type="submit" className="w-fit underline">
            Submit ticket
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Request a return</h2>
        <p className="text-sm text-muted">
          Requires a delivered fulfilment group for that seller.
        </p>
        <form onSubmit={createReturn} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Order id
            <input
              name="orderId"
              required
              defaultValue={defaultOrderId}
              className="border border-black/20 bg-transparent px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Seller id
            <input
              name="sellerId"
              required
              defaultValue={defaultSellerId}
              className="border border-black/20 bg-transparent px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Quantity
            <input
              name="quantity"
              type="number"
              min={1}
              defaultValue={1}
              className="border border-black/20 bg-transparent px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Reason
            <textarea
              name="reason"
              required
              minLength={5}
              rows={3}
              className="border border-black/20 bg-transparent px-3 py-2"
            />
          </label>
          <button type="submit" className="w-fit underline">
            Submit return
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Open a dispute</h2>
        <form onSubmit={createDispute} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Order id
            <input
              name="orderId"
              required
              defaultValue={defaultOrderId}
              className="border border-black/20 bg-transparent px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Seller id
            <input
              name="sellerId"
              required
              defaultValue={defaultSellerId}
              className="border border-black/20 bg-transparent px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Reason
            <textarea
              name="reason"
              required
              minLength={10}
              rows={3}
              className="border border-black/20 bg-transparent px-3 py-2"
            />
          </label>
          <button type="submit" className="w-fit underline">
            Open dispute
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Your tickets</h2>
        {tickets.length === 0 ? (
          <p className="text-sm text-muted">No tickets yet.</p>
        ) : (
          <ul className="flex flex-col gap-3 text-sm">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="border-t border-black/10 pt-3">
                <p className="font-medium">
                  {ticket.subject} · {ticket.status}
                </p>
                <p className="text-muted">{ticket.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
