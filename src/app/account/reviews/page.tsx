import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui/page-shell";
import {
  listBuyerReviews,
  listPendingReviews,
} from "@/modules/account/service";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Reviews" };

export default async function AccountReviewsPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/account/reviews");
  }
  const [reviews, pending] = await Promise.all([
    listBuyerReviews(actor),
    listPendingReviews(actor),
  ]);

  return (
    <PageShell narrow>
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          Activity
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          My Reviews & Ratings
        </h1>
        <p className="mt-2 text-muted">
          Rate delivered purchases and see reviews awaiting moderation.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          Pending ratings ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted">
            No delivered items waiting for a review.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((line) => (
              <li
                key={line.id}
                className="rounded-[var(--radius)] border border-border bg-surface p-4 text-sm"
              >
                <p className="font-medium">
                  {line.productTitle} / {line.variantTitle}
                </p>
                <p className="mt-1 text-muted">
                  {line.order.orderNumber} ·{" "}
                  {new Date(line.order.createdAt).toLocaleDateString("en-IN")}
                </p>
                <Link
                  href={`/orders/${line.orderId}`}
                  className="mt-2 inline-block text-accent underline"
                >
                  Rate from order
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          Your reviews ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted">You have not written a review yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-[var(--radius)] border border-border bg-surface p-4 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {review.rating}★ · {review.title}
                  </p>
                  <span className="capitalize text-muted">{review.status}</span>
                </div>
                <p className="mt-2 text-muted">{review.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm">
        <Link href="/account" className="underline">
          Back to account
        </Link>
      </p>
    </PageShell>
  );
}
