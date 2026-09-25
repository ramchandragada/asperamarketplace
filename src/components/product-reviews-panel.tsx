"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type Review = {
  id: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
};

export function ProductReviewsPanel({
  productId,
  initialReviews,
  canReview,
  seededAverage,
  seededCount,
  seededDistribution,
}: {
  productId: string;
  initialReviews: Review[];
  canReview: boolean;
  seededAverage?: number | null;
  seededCount?: number;
  seededDistribution?: Record<string, number> | null;
}) {
  const [reviews] = useState(initialReviews);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const buckets = useMemo(() => {
    if (reviews.length > 0) {
      const counts = [0, 0, 0, 0, 0];
      for (const review of reviews) {
        const idx = Math.min(4, Math.max(0, review.rating - 1));
        counts[idx] = (counts[idx] ?? 0) + 1;
      }
      return counts;
    }
    if (seededDistribution) {
      return [1, 2, 3, 4, 5].map(
        (star) => seededDistribution[String(star)] ?? 0,
      );
    }
    return [0, 0, 0, 0, 0];
  }, [reviews, seededDistribution]);

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : (seededAverage ?? 0);
  const totalCount = reviews.length > 0 ? reviews.length : (seededCount ?? 0);
  const maxBucket = Math.max(1, ...buckets);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/trust/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productId,
        rating: Number(form.get("rating") ?? 5),
        title: String(form.get("title") ?? ""),
        body: String(form.get("body") ?? ""),
      }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Could not submit review");
      return;
    }
    setMessage("Thanks — your review was submitted for moderation.");
    setShowForm(false);
    event.currentTarget.reset();
  }

  const labels = ["Poor", "Average", "Good", "Very Good", "Excellent"] as const;

  return (
    <section aria-labelledby="reviews-heading" className="flex flex-col gap-5">
      <h2 id="reviews-heading" className="font-display text-2xl font-semibold">
        Product ratings & reviews
      </h2>

      <div className="grid gap-6 rounded-[var(--radius)] border border-border bg-surface p-4 md:grid-cols-[10rem_minmax(0,1fr)] md:p-6">
        <div className="flex flex-col items-center justify-center gap-1">
          <p className="text-4xl font-bold">{average.toFixed(1)}</p>
          <p className="text-warning" aria-hidden>
            {"★".repeat(Math.round(average)) || "☆"}
          </p>
          <p className="text-xs text-muted">
            {totalCount} rating{totalCount === 1 ? "" : "s"} · {reviews.length}{" "}
            review{reviews.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = buckets[star - 1] ?? 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-16 text-muted">{labels[star - 1]}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-success"
                    style={{ width: `${(count / maxBucket) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-muted">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {canReview ? (
        <div>
          <button
            type="button"
            className="rounded-[var(--radius-sm)] border border-accent px-4 py-2 text-sm font-semibold text-accent"
            onClick={() => setShowForm((open) => !open)}
          >
            Write a review
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted">
          <Link href="/login" className="font-medium text-accent underline">
            Sign in
          </Link>{" "}
          to write a review.
        </p>
      )}

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {showForm && canReview ? (
        <form onSubmit={submit} className="flex max-w-lg flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Rating
            <select
              name="rating"
              defaultValue={5}
              className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Title
            <input
              name="title"
              required
              className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Review
            <textarea
              name="body"
              required
              rows={4}
              className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="w-fit rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
          >
            Submit review
          </button>
        </form>
      ) : null}

      {reviews.length === 0 ? (
        <p className="text-sm text-muted">
          Be the first to share feedback once you receive your order.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-[var(--radius)] border border-border bg-surface p-4"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded bg-success px-1.5 py-0.5 text-xs font-semibold text-white">
                  ★ {review.rating}
                </span>
                <p className="font-medium">{review.title}</p>
              </div>
              <p className="mt-2 text-sm text-muted">{review.body}</p>
              <p className="mt-2 text-xs text-muted">
                {new Date(review.createdAt).toLocaleDateString("en-IN")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
