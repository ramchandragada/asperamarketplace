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
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function AppDownloadBanner() {
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => false);

  function dismiss() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event("aspera-app-banner"));
  }

  if (dismissed) return null;

  return (
    <div className="relative z-30 h-10 border-b border-[#c4451a]/25 bg-gradient-to-r from-[#ff6b6b] via-[#ee5a24] to-[#ff6b6b] text-white">
      <div className="container-shell flex h-full items-center justify-between gap-3 text-sm">
        <p className="min-w-0 truncate font-medium">
          <span aria-hidden>📱 </span>
          Download Aspera App &amp; get up to{" "}
          <span className="font-bold">35% OFF</span> on your 1st order
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/download-app"
            className="text-xs font-bold underline underline-offset-2 hover:text-white/90"
          >
            Download Now
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="flex h-7 w-7 items-center justify-center rounded text-white/90 hover:bg-white/15"
            aria-label="Dismiss app banner"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
