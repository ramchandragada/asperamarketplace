"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function PanelAccountMenu({
  displayName,
  showSeller,
  showAdmin,
}: {
  displayName: string;
  showSeller: boolean;
  showAdmin: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={rootRef} className="relative mt-3">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-[var(--radius-sm)] border border-border px-3 py-2 text-left text-sm"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="truncate font-medium">{displayName}</span>
        <span className="text-muted" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div className="absolute left-0 right-0 z-20 mt-1 flex flex-col rounded-[var(--radius-sm)] border border-border bg-background py-1 shadow-sm">
          <Link
            href="/account"
            className="px-3 py-2 text-sm hover:bg-accent-soft/60"
            onClick={() => setOpen(false)}
          >
            Account
          </Link>
          {showSeller ? (
            <Link
              href="/seller"
              className="px-3 py-2 text-sm hover:bg-accent-soft/60"
              onClick={() => setOpen(false)}
            >
              Seller dashboard
            </Link>
          ) : null}
          {showAdmin ? (
            <Link
              href="/admin"
              className="px-3 py-2 text-sm hover:bg-accent-soft/60"
              onClick={() => setOpen(false)}
            >
              Admin
            </Link>
          ) : null}
          <button
            type="button"
            className="px-3 py-2 text-left text-sm text-red-700 hover:bg-accent-soft/60"
            onClick={() => void signOut()}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
