import Link from "next/link";
import { LegalImprint } from "@/components/legal-imprint";
import { PageShell } from "@/components/ui/page-shell";
import { asperaLegal } from "@/platform/config/aspera-legal";

export const metadata = {
  title: "Grievance officer",
  description:
    "Grievance redressal for Aspera Express under the Consumer Protection (E-commerce) Rules, 2020.",
};

export default function GrievancePage() {
  const officer = asperaLegal.grievanceOfficer;

  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">Grievance officer</h1>
      <p className="mt-3 text-muted leading-7">
        Under the Consumer Protection (E-commerce) Rules, 2020,{" "}
        {asperaLegal.legalEntity} designates the following grievance officer for{" "}
        {asperaLegal.marketplaceName}.
      </p>

      <dl className="mt-8 space-y-3 rounded-[var(--radius)] border border-border bg-surface p-5 text-sm">
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
            Name
          </dt>
          <dd className="mt-0.5 font-medium text-foreground">{officer.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
            Designation
          </dt>
          <dd className="mt-0.5 text-foreground">{officer.designation}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
            Email
          </dt>
          <dd className="mt-0.5">
            <a
              href={`mailto:${officer.email}`}
              className="font-medium text-accent underline"
            >
              {officer.email}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
            Phone
          </dt>
          <dd className="mt-0.5">
            <a
              href={`tel:${officer.phoneTel}`}
              className="font-medium text-accent underline"
            >
              {officer.phoneDisplay}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
            Postal address
          </dt>
          <dd className="mt-0.5 text-foreground">
            {officer.postalAddress.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </dd>
        </div>
      </dl>

      <h2 className="mt-8 text-lg font-semibold">Timelines</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted">
        <li>
          Acknowledgement of a written grievance within{" "}
          <strong className="text-foreground">48 hours</strong> of receipt.
        </li>
        <li>
          Redressal within{" "}
          <strong className="text-foreground">one month</strong> from the date
          of receipt of the grievance.
        </li>
      </ul>

      <p className="mt-6 text-sm text-muted leading-6">
        For order tracking and routine support, use{" "}
        <Link href="/support" className="text-accent underline">
          /support
        </Link>{" "}
        or {asperaLegal.supportEmail}. Escalate unresolved consumer grievances
        to the officer above.
      </p>
      <LegalImprint />
    </PageShell>
  );
}
