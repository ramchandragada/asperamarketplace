"use client";

import { FormEvent, useState } from "react";

type Summary = {
  risk: number;
  counterfeit: number;
  reviews: number;
  privacy: number;
  compliance: number;
};

type RiskCase = {
  id: string;
  title: string;
  severity: string;
  status: string;
  subjectType: string;
  subjectId: string;
};

type CounterfeitCase = {
  id: string;
  brandClaim: string;
  status: string;
  productId: string;
  sellerId: string;
};

type Review = {
  id: string;
  title: string;
  rating: number;
  status: string;
  body: string;
};

type PrivacyRow = {
  id: string;
  requestType: string;
  status: string;
  details: string;
};

type Evidence = {
  id: string;
  registerKey: string;
  title: string;
  status: string;
};

export function TrustOpsPanel({
  initialSummary,
  initialRisk,
  initialCounterfeit,
  initialReviews,
  initialPrivacy,
  initialEvidence,
}: {
  initialSummary: Summary;
  initialRisk: RiskCase[];
  initialCounterfeit: CounterfeitCase[];
  initialReviews: Review[];
  initialPrivacy: PrivacyRow[];
  initialEvidence: Evidence[];
}) {
  const [summary, setSummary] = useState(initialSummary);
  const [risk, setRisk] = useState(initialRisk);
  const [counterfeit, setCounterfeit] = useState(initialCounterfeit);
  const [reviews, setReviews] = useState(initialReviews);
  const [privacy, setPrivacy] = useState(initialPrivacy);
  const [evidence, setEvidence] = useState(initialEvidence);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [riskRes, cfRes, revRes, privRes, compRes] = await Promise.all([
      fetch("/api/trust/risk-cases"),
      fetch("/api/trust/counterfeit"),
      fetch("/api/trust/reviews"),
      fetch("/api/trust/privacy"),
      fetch("/api/trust/compliance"),
    ]);
    const riskBody = (await riskRes.json()) as { data?: { cases: RiskCase[] } };
    const cfBody = (await cfRes.json()) as {
      data?: { cases: CounterfeitCase[] };
    };
    const revBody = (await revRes.json()) as { data?: { reviews: Review[] } };
    const privBody = (await privRes.json()) as {
      data?: { requests: PrivacyRow[] };
    };
    const compBody = (await compRes.json()) as {
      data?: { evidence: Evidence[] };
    };
    if (riskRes.ok) setRisk(riskBody.data?.cases ?? []);
    if (cfRes.ok) setCounterfeit(cfBody.data?.cases ?? []);
    if (revRes.ok) setReviews(revBody.data?.reviews ?? []);
    if (privRes.ok) setPrivacy(privBody.data?.requests ?? []);
    if (compRes.ok) setEvidence(compBody.data?.evidence ?? []);
    setSummary({
      risk: (riskBody.data?.cases ?? []).filter((c) =>
        ["open", "investigating"].includes(c.status),
      ).length,
      counterfeit: (cfBody.data?.cases ?? []).filter((c) =>
        ["reported", "under_review"].includes(c.status),
      ).length,
      reviews: (revBody.data?.reviews ?? []).length,
      privacy: (privBody.data?.requests ?? []).filter((c) =>
        ["received", "in_progress"].includes(c.status),
      ).length,
      compliance: (compBody.data?.evidence ?? []).filter((c) =>
        ["draft", "submitted"].includes(c.status),
      ).length,
    });
  }

  async function openRisk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/trust/risk-cases", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subjectType: String(form.get("subjectType") ?? "seller"),
        subjectId: String(form.get("subjectId") ?? ""),
        severity: String(form.get("severity") ?? "medium"),
        title: String(form.get("title") ?? ""),
        details: String(form.get("details") ?? ""),
      }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Failed");
      return;
    }
    setMessage(body.message ?? "Opened");
    event.currentTarget.reset();
    await refresh();
  }

  async function moderate(reviewId: string, decision: "approve" | "reject") {
    const response = await fetch("/api/trust/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reviewId,
        decision,
        reason: decision === "approve" ? "Meets guidelines" : "Policy violation",
      }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Moderate failed");
      return;
    }
    setMessage(body.message ?? "Moderated");
    await refresh();
  }

  async function decideCounterfeit(
    caseId: string,
    decision: "uphold" | "dismiss",
  ) {
    const response = await fetch("/api/trust/counterfeit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        caseId,
        decision,
        reason:
          decision === "uphold"
            ? "Brand claim upheld"
            : "Insufficient evidence",
      }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Review failed");
      return;
    }
    setMessage(body.message ?? "Reviewed");
    await refresh();
  }

  async function addEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/trust/compliance", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        registerKey: String(form.get("registerKey") ?? ""),
        title: String(form.get("title") ?? ""),
        summary: String(form.get("summary") ?? ""),
      }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Failed");
      return;
    }
    setMessage(body.message ?? "Drafted");
    event.currentTarget.reset();
    await refresh();
  }

  return (
    <div className="flex flex-col gap-10">
      {message ? <p className="text-sm">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <section className="text-sm text-muted">
        Open risk {summary.risk} · Counterfeit {summary.counterfeit} · Reviews{" "}
        {summary.reviews} · Privacy {summary.privacy} · Compliance{" "}
        {summary.compliance}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Open risk case</h2>
        <form onSubmit={openRisk} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Subject type
            <select
              name="subjectType"
              defaultValue="seller"
              className="border border-black/20 bg-transparent px-3 py-2"
            >
              <option value="seller">seller</option>
              <option value="user">user</option>
              <option value="order">order</option>
              <option value="product">product</option>
              <option value="payment">payment</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Subject id
            <input
              name="subjectId"
              required
              className="border border-black/20 bg-transparent px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Severity
            <select
              name="severity"
              defaultValue="medium"
              className="border border-black/20 bg-transparent px-3 py-2"
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Title
            <input
              name="title"
              required
              minLength={5}
              className="border border-black/20 bg-transparent px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Details
            <textarea
              name="details"
              required
              minLength={10}
              rows={3}
              className="border border-black/20 bg-transparent px-3 py-2"
            />
          </label>
          <button type="submit" className="w-fit underline">
            Open case
          </button>
        </form>
        <ul className="text-sm">
          {risk.slice(0, 10).map((row) => (
            <li key={row.id}>
              {row.severity} · {row.status} · {row.title}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Counterfeit queue</h2>
        {counterfeit.length === 0 ? (
          <p className="text-sm text-muted">No counterfeit reports.</p>
        ) : (
          counterfeit.map((row) => (
            <article
              key={row.id}
              className="border-t border-black/10 pt-3 text-sm"
            >
              <p>
                {row.brandClaim} · {row.status}
              </p>
              {(row.status === "reported" || row.status === "under_review") && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="underline"
                    onClick={() => void decideCounterfeit(row.id, "uphold")}
                  >
                    Uphold
                  </button>
                  <button
                    type="button"
                    className="underline"
                    onClick={() => void decideCounterfeit(row.id, "dismiss")}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Review moderation</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted">No pending reviews.</p>
        ) : (
          reviews.map((row) => (
            <article
              key={row.id}
              className="border-t border-black/10 pt-3 text-sm"
            >
              <p className="font-medium">
                {row.rating}/5 · {row.title}
              </p>
              <p className="text-muted">{row.body}</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="underline"
                  onClick={() => void moderate(row.id, "approve")}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="underline"
                  onClick={() => void moderate(row.id, "reject")}
                >
                  Reject
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Privacy requests</h2>
        <ul className="text-sm">
          {privacy.map((row) => (
            <li key={row.id}>
              {row.requestType} · {row.status}
            </li>
          ))}
          {privacy.length === 0 ? <li>None open.</li> : null}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Compliance evidence</h2>
        <form onSubmit={addEvidence} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Register key
            <input
              name="registerKey"
              required
              placeholder="A-21"
              className="border border-black/20 bg-transparent px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Title
            <input
              name="title"
              required
              className="border border-black/20 bg-transparent px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Summary
            <textarea
              name="summary"
              required
              minLength={10}
              rows={3}
              className="border border-black/20 bg-transparent px-3 py-2"
            />
          </label>
          <button type="submit" className="w-fit underline">
            Draft evidence
          </button>
        </form>
        <ul className="text-sm">
          {evidence.map((row) => (
            <li key={row.id}>
              {row.registerKey} · {row.status} · {row.title}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
