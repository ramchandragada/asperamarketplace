import { redirect } from "next/navigation";
import { listBuyerNotifications } from "@/modules/account/service";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications" };

export default async function AccountNotificationsPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/account/notifications");
  }
  const notifications = await listBuyerNotifications(actor);

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          Activity
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          All Notifications
        </h1>
        <p className="mt-2 text-muted">
          Order and account messages sent to {actor.email}.
        </p>
      </div>

      {notifications.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-border bg-surface p-5 text-sm text-muted">
          No notifications yet. You will see order confirmations and fulfilment
          updates here.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notifications.map((note) => (
            <li
              key={note.id}
              className="rounded-[var(--radius)] border border-border bg-surface p-4 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{note.templateKey}</p>
                <span className="capitalize text-muted">{note.status}</span>
              </div>
              <p className="mt-1 text-muted">
                {note.channel} ·{" "}
                {new Date(note.createdAt).toLocaleString("en-IN")}
                {note.sentAt
                  ? ` · sent ${new Date(note.sentAt).toLocaleString("en-IN")}`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
