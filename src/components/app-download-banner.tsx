"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "aspera.app-banner-dismissed";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("aspera-app-banner", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("aspera-app-banner", onStoreChange);
  };
}

function readDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function AppDownloadBanner() {
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => false);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event("aspera-app-banner"));
  }

  if (dismissed) return null;

  return (
    <div className="relative z-30 border-b border-[#c45a1a]/30 bg-gradient-to-r from-[#e8833a] via-[#f0a05a] to-[#e8833a] text-white">
      <div className="container-shell flex h-10 items-center justify-between gap-3 text-sm">
        <p className="min-w-0 truncate font-medium">
          Shop on App to get upto{" "}
          <span className="font-bold">35% OFF</span> on 1st order
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/download-app"
            className="rounded bg-white px-3 py-1 text-xs font-bold text-[#c45a1a] shadow-sm hover:bg-[#fff8f0]"
          >
            Download Now
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="flex h-7 w-7 items-center justify-center rounded text-white/90 hover:bg-white/15"
            aria-label="Dismiss app banner"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
