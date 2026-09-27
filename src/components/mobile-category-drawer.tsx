"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { ALL_CATEGORIES_MENU, MEGA_MENU } from "@/lib/mega-menu";

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      {open ? (
        <path
          d="M6 6l12 12M18 6 6 18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function MobileCategoryDrawer() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-background px-2.5 text-sm font-medium"
        aria-expanded={open}
        aria-controls={titleId}
        onClick={() => setOpen((value) => !value)}
      >
        <MenuIcon open={open} />
        Categories
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            aria-label="Close categories"
            onClick={() => setOpen(false)}
          />
          <div
            id={titleId}
            role="dialog"
            aria-modal="true"
            aria-label="Browse categories"
            className="absolute inset-y-0 left-0 flex w-[min(100%,22rem)] flex-col bg-surface shadow-[var(--shadow-mega)]"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-display text-lg font-semibold">Categories</p>
              <button
                type="button"
                className="rounded-[var(--radius-sm)] p-2 text-muted hover:bg-accent-soft/70 hover:text-foreground"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <MenuIcon open />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-24">
              <Link
                href={ALL_CATEGORIES_MENU.href}
                className="block border-b border-border px-4 py-3 text-sm font-semibold text-accent"
                onClick={() => setOpen(false)}
              >
                View all categories →
              </Link>
              <ul>
                {MEGA_MENU.map((category) => {
                  const isOpen = expanded === category.key;
                  return (
                    <li key={category.key} className="border-b border-border">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
                        aria-expanded={isOpen}
                        onClick={() =>
                          setExpanded((current) =>
                            current === category.key ? null : category.key,
                          )
                        }
                      >
                        {category.label}
                        <span className="text-muted" aria-hidden>
                          {isOpen ? "▾" : "▸"}
                        </span>
                      </button>
                      {isOpen ? (
                        <div className="space-y-3 bg-background/60 px-4 pb-3">
                          <Link
                            href={category.href}
                            className="text-xs font-medium text-accent"
                            onClick={() => setOpen(false)}
                          >
                            Shop all {category.label}
                          </Link>
                          {category.columns.map((column) => (
                            <div key={column.heading}>
                              <p className="text-[12px] font-bold text-accent">
                                {column.heading}
                              </p>
                              <ul className="mt-1.5 space-y-1">
                                {column.links.map((item) => (
                                  <li key={item.href + item.label}>
                                    <Link
                                      href={item.href}
                                      className="block py-1 text-sm text-foreground"
                                      onClick={() => setOpen(false)}
                                    >
                                      {item.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
