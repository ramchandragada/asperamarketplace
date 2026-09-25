import Link from "next/link";
import { redirect } from "next/navigation";
import { FinanceConsolePanel } from "@/components/finance-console-panel";
import { actorIsAdmin } from "@/modules/identity/policy";
import { getOptionalActor } from "@/modules/identity/service";
import {
  financeSummary,
  listJournalEntries,
  listReconciliationExceptions,
  listSettlements,
} from "@/modules/finance/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Finance · Aspera Marketplace" };

export default async function AdminFinancePage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login");
  }
  if (!actorIsAdmin(actor)) {
    redirect("/account");
  }

  const [summary, entries, settlements, exceptions] = await Promise.all([
    financeSummary(actor),
    listJournalEntries(actor),
    listSettlements(actor),
    listReconciliationExceptions(actor),
  ]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Finance</h1>
        <p className="mt-2 text-muted">
          Double-entry ledger, commission settlements, and reconciliation
          exceptions. Mock payouts only.
        </p>
      </div>
      <FinanceConsolePanel
        initialSummary={summary}
        initialEntries={entries.map((entry) => ({
          ...entry,
          postedAt: entry.postedAt?.toISOString() ?? null,
        }))}
        initialSettlements={settlements.map((batch) => ({
          ...batch,
          periodStart: batch.periodStart.toISOString(),
          periodEnd: batch.periodEnd.toISOString(),
        }))}
        initialExceptions={exceptions}
      />
      <p className="text-sm">
        <Link href="/account" className="underline">
          Account
        </Link>
      </p>
    </main>
  );
}
