"use client";

import { useState } from "react";

export function ProductShareBar({
  title,
  url,
}: {
  title: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      void import("@/components/toast-host").then(({ showToast }) => {
        showToast("Link copied");
      });
    } catch {
      void import("@/components/toast-host").then(({ showToast }) => {
        showToast("Could not copy link");
      });
    }
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold tracking-wide text-muted uppercase">
        Share
      </span>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:border-accent hover:text-accent"
      >
        WhatsApp
      </a>
      <button
        type="button"
        onClick={() => void copyLink()}
        className="inline-flex items-center rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:border-accent hover:text-accent"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
