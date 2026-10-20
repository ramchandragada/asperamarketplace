import { FinanceConsolePanel } from "@/components/finance-console-panel";
import { getOptionalActor } from "@/modules/identity/service";
import {
  financeSummary,
  listJournalEntries,
  listReconciliationExceptions,
  listSettlements,
} from "@/modules/finance/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Finance" };

export default async function AdminFinancePage() {
  const actor = await getOptionalActor();

  const [summary, entries, settlements, exceptions] = await Promise.all([
    financeSummary(actor!),
    listJournalEntries(actor!),
    listSettlements(actor!),
    listReconciliationExceptions(actor!),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Finance</h1>
        <p className="mt-2 text-muted">
          Ledger entries, commission settlements, and reconciliation exceptions.
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
    </div>
  );
}
