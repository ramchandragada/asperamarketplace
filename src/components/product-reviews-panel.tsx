"use client";

import { FormEvent, useState } from "react";

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
}: {
  productId: string;
  initialReviews: Review[];
  canReview: boolean;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setMessage(
      body.message ?? "Submitted for moderation. Approved reviews appear here.",
    );
    event.currentTarget.reset();
  }

  return (
    <section aria-labelledby="reviews-heading" className="flex flex-col gap-4">
      <h2 id="reviews-heading" className="text-xl font-semibold">
        Reviews
      </h2>
      {message ? <p className="text-sm">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {reviews.length === 0 ? (
        <p className="text-sm text-muted">No approved reviews yet.</p>
      ) : (
        <ul className="flex flex-col gap-3 text-sm">
          {reviews.map((review) => (
            <li key={review.id} className="border-t border-border pt-3">
              <p className="font-medium">
                {review.rating}/5 · {review.title}
              </p>
              <p className="text-muted">{review.body}</p>
            </li>
          ))}
        </ul>
      )}
      {canReview ? (
        <form onSubmit={submit} className="mt-2 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Rating
            <select
              name="rating"
              defaultValue={5}
              className="border border-black/20 bg-transparent px-3 py-2"
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
              minLength={3}
              className="border border-black/20 bg-transparent px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Review
            <textarea
              name="body"
              required
              minLength={10}
              rows={3}
              className="border border-black/20 bg-transparent px-3 py-2"
            />
          </label>
          <button type="submit" className="w-fit underline">
            Submit for moderation
          </button>
        </form>
      ) : (
        <p className="text-sm text-muted">
          <a href="/login" className="underline">
            Sign in
          </a>{" "}
          to leave a review.
        </p>
      )}
    </section>
  );
}
