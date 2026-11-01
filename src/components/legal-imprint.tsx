import Link from "next/link";
import { asperaLegal } from "@/platform/config/aspera-legal";

/** Compact entity block for the bottom of legal / policy pages. */
export function LegalImprint({ className = "" }: { className?: string }) {
  return (
    <aside
      className={`mt-10 rounded-[var(--radius)] border border-border bg-surface p-4 text-xs leading-5 text-muted ${className}`}
    >
      <p className="font-semibold text-foreground">{asperaLegal.legalEntity}</p>
      <p className="mt-1">
        CIN {asperaLegal.cin} · PAN {asperaLegal.pan}
      </p>
      <p>
        GSTIN (Regular) {asperaLegal.gstinRegular} · GSTIN (TCS / ECO){" "}
        {asperaLegal.gstinTcs}
      </p>
      <p className="mt-1">{asperaLegal.tcsPpob.lines.join(", ")}</p>
      <p className="mt-2">
        Support:{" "}
        <a
          href={`mailto:${asperaLegal.supportEmail}`}
          className="text-accent underline"
        >
          {asperaLegal.supportEmail}
        </a>
        {" · "}
        <a
          href={`tel:${asperaLegal.supportPhoneTel}`}
          className="text-accent underline"
        >
          {asperaLegal.supportPhoneDisplay}
        </a>
        {" · "}
        <Link href="/grievance" className="text-accent underline">
          Grievance officer
        </Link>
      </p>
    </aside>
  );
}
